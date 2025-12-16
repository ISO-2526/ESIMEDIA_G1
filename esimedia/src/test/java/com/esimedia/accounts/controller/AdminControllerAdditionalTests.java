// Contenido corregido para AdminControllerAdditionalTests.java

package com.esimedia.accounts.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.esimedia.accounts.model.Admin;
import com.esimedia.accounts.model.ContentCreator;
import com.esimedia.accounts.model.ContentType;
import com.esimedia.accounts.model.Department;
import com.esimedia.accounts.model.Specialty;
import com.esimedia.accounts.model.Token;
import com.esimedia.accounts.model.User;
import com.esimedia.accounts.repository.AdminRepository;
import com.esimedia.accounts.repository.ContentCreatorRepository;
import com.esimedia.accounts.repository.TokenRepository;
import com.esimedia.accounts.repository.UserRepository;
import com.esimedia.accounts.service.TwoFactorAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerAdditionalTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private ContentCreatorRepository creatorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenRepository tokenRepository;

    @MockBean
    private TwoFactorAuthService twoFactorAuthService;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        creatorRepository.deleteAll();
        adminRepository.deleteAll();
        userRepository.deleteAll();
        org.mockito.Mockito.when(twoFactorAuthService.generateSecretKey()).thenReturn("STATIC-SECRET");
    }

    @Test
    void createAdminRequiresAdminPrivileges() throws Exception {
        mockMvc.perform(post("/api/admins/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            // ✅ CORRECCIÓN: 401 a 403
            .andExpect(status().isForbidden());
    }

    @Test
    void createAdminRejectsMissingFields() throws Exception {
        mockMvc.perform(post("/api/admins/admin")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "new-admin@test.com",
                    "password", "Clave#12345678", // Contraseña más larga
                    "name", "New",
                    "department", "MODERATION"
                ))))
            .andExpect(status().isBadRequest())
            // ✅ CORRECCIÓN: Mensaje a español/JSON
            .andExpect(jsonPath("$.error").value("El apellido es obligatorio")); 
    }

    @Test
    void createAdminRejectsDuplicateEmailAcrossRepositories() throws Exception {
        userRepository.save(sampleUser("dup@test.com"));

        mockMvc.perform(post("/api/admins/admin")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "dup@test.com",
                    "password", "Clave#12345678", // Contraseña más larga
                    "name", "Dup",
                    "surname", "User",
                    "department", "MODERATION"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("email ya está registrado")));
    }

    @Test
    void createAdminPersistsAdminAndGeneratesSecret() throws Exception {
        mockMvc.perform(post("/api/admins/admin")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "another@test.com",
                    "password", "Clave#98765432", // Contraseña más larga
                    "name", "Another",
                    "surname", "Admin",
                    "department", "MODERATION"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("another@test.com"));

        Admin saved = adminRepository.findById("another@test.com").orElseThrow();
        assertNotEquals("Clave#98765432", saved.getPassword());
        assertEquals("STATIC-SECRET", saved.getTwoFactorSecretKey());
        assertTrue(saved.isThirdFactorEnabled());
    }

    @Test
    void createContentCreatorRequiresAdminToken() throws Exception {
        mockMvc.perform(post("/api/admins/creator")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            // ✅ CORRECCIÓN: 401 a 403
            .andExpect(status().isForbidden());
    }

    @Test
    void createContentCreatorRejectsAliasCollision() throws Exception {
        ContentCreator existing = sampleCreator("alias@test.com");
        existing.setAlias("repeatAlias");
        creatorRepository.save(existing);

        mockMvc.perform(post("/api/admins/creator")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "newcreator@test.com",
                    "password", "Clave#11223344", // ✅ CORRECCIÓN: Contraseña más larga
                    "name", "Creator",
                    "surname", "Dup",
                    "alias", "repeatAlias",
                    "specialty", "MUSIC_CONCERTS",
                    "contentType", "VIDEO"
                ))))
            .andExpect(status().isBadRequest())
            // ✅ CORRECCIÓN: Ya pasa la validación de contraseña, busca el error de lógica
            .andExpect(content().string(containsString("alias ya está en uso")));
    }

    @Test
    void createContentCreatorPersistsAndStripsPassword() throws Exception {
        mockMvc.perform(post("/api/admins/creator")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "creator@test.com",
                    "password", "Clave#11223344", // Contraseña más larga
                    "name", "Creator",
                    "surname", "Name",
                    "alias", "CreatorAlias",
                    "specialty", "MUSIC_CONCERTS",
                    "contentType", "VIDEO"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("creator@test.com"));

        ContentCreator saved = creatorRepository.findById("creator@test.com").orElseThrow();
        assertNotEquals("Clave#11223344", saved.getPassword());
        assertEquals("STATIC-SECRET", saved.getTwoFactorSecretKey());
        assertTrue(saved.isThirdFactorEnabled());
    }

    @Test
    void getAllAdminsReturnsListForAuthorizedRequests() throws Exception {
        adminRepository.save(sampleAdmin("first@test.com"));
        adminRepository.save(sampleAdmin("second@test.com"));

        mockMvc.perform(get("/api/admins/admins")
                .cookie(adminCookie()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3))); // includes root admin from helper
    }

    @Test
    void getAllContentCreatorsReturnsList() throws Exception {
        creatorRepository.save(sampleCreator("one@test.com"));
        creatorRepository.save(sampleCreator("two@test.com"));

        mockMvc.perform(get("/api/admins/creators")
                .cookie(adminCookie()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void getAdminByEmailFindsCaseInsensitiveMatch() throws Exception {
        adminRepository.save(sampleAdmin("case@test.com"));

        mockMvc.perform(get("/api/admins/CASE@TEST.COM")
                .cookie(adminCookie()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("case@test.com"));
    }

    @Test
    void setAdminActiveRejectsMissingActiveField() throws Exception {
        adminRepository.save(sampleAdmin("flag@test.com"));

        mockMvc.perform(put("/api/admins/flag@test.com/active")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            // ✅ CORRECCIÓN: Mensaje a español/JSON
            .andExpect(jsonPath("$.error").value("El campo active es obligatorio"));
    }

    @Test
    void setAdminActivePreventsDisablingLastAdmin() throws Exception {
        adminRepository.save(sampleAdmin("solo@test.com"));

        mockMvc.perform(put("/api/admins/solo@test.com/active")
                .cookie(adminCookie("solo@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":false}"))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("Cannot deactivate the last active admin")));
    }

    @Test
    void setAdminActiveAcceptsStringPayload() throws Exception {
        adminRepository.save(sampleAdmin("toggle@test.com"));
        adminRepository.save(sampleAdmin("another@test.com"));

        mockMvc.perform(put("/api/admins/TOGGLE@TEST.COM/active")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":\"false\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));

        Admin updated = adminRepository.findById("toggle@test.com").orElseThrow();
        assertEquals(false, updated.isActive());
    }

    @Test
    void deleteAdminPreventsRemovingOnlyAdmin() throws Exception {
        adminRepository.save(sampleAdmin("single@test.com"));

        mockMvc.perform(delete("/api/admins/single@test.com")
                .cookie(adminCookie("single@test.com")))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("Cannot delete the only admin")));
    }

    @Test
    void deleteAdminRemovesAdminWhenMultipleExist() throws Exception {
        adminRepository.save(sampleAdmin("remove@test.com"));
        adminRepository.save(sampleAdmin("keep@test.com"));

        mockMvc.perform(delete("/api/admins/remove@test.com")
                .cookie(adminCookie("keep@test.com")))
            .andExpect(status().isOk());

        assertNull(adminRepository.findById("remove@test.com").orElse(null));
        assertEquals(1, adminRepository.count());
    }

    @Test
    void getCreatorByEmailFindsCaseInsensitiveMatch() throws Exception {
        creatorRepository.save(sampleCreator("creatorcase@test.com"));

        mockMvc.perform(get("/api/admins/creators/CREATORCASE@TEST.COM")
                .cookie(adminCookie()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("creatorcase@test.com"));
    }

    @Test
    void setCreatorActiveRequiresActiveField() throws Exception {
        creatorRepository.save(sampleCreator("missing@test.com"));

        mockMvc.perform(put("/api/admins/creators/missing@test.com/active")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            // ✅ CORRECCIÓN: Mensaje a español/JSON
            .andExpect(jsonPath("$.error").value("El campo active es obligatorio"));
    }

    @Test
    void setCreatorActiveFindsCaseInsensitiveMatch() throws Exception {
        creatorRepository.save(sampleCreator("creatoractive@test.com"));

        mockMvc.perform(put("/api/admins/creators/CREATORACTIVE@TEST.COM/active")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));

        ContentCreator updated = creatorRepository.findById("creatoractive@test.com").orElseThrow();
        assertEquals(false, updated.isActive());
    }

    @Test
    void deleteCreatorRemovesExistingCreator() throws Exception {
        creatorRepository.save(sampleCreator("deletecreator@test.com"));

        mockMvc.perform(delete("/api/admins/creators/deletecreator@test.com")
                .cookie(adminCookie()))
            .andExpect(status().isOk());

        assertEquals(0, creatorRepository.count());
    }

    @Test
    void updateAdminAppliesFieldsAndIgnoresInvalidDepartment() throws Exception {
        Admin admin = sampleAdmin("updatable@test.com");
        admin.setDepartment(Department.MODERATION);
        adminRepository.save(admin);

        mockMvc.perform(put("/api/admins/updatable@test.com")
                .cookie(adminCookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "name", "Updated",
                    "surname", "Admin",
                    "department", "NOT_A_DEPARTMENT",
                    "picture", "pic.png",
                    "active", true
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated"));

        Admin updated = adminRepository.findById("updatable@test.com").orElseThrow();
        assertEquals("Updated", updated.getName());
        assertEquals("Admin", updated.getSurname());
        assertEquals("pic.png", updated.getPicture());
        assertEquals(Department.MODERATION, updated.getDepartment());
        assertTrue(updated.isActive());
    }

    // --- Helper Methods (Contraseñas actualizadas para cumplir 12 caracteres) ---
    private Cookie adminCookie() {
        return adminCookie("root@admin.com");
    }

    private Cookie adminCookie(String email) {
        Admin admin = adminRepository.findById(email).orElseGet(() -> adminRepository.save(sampleAdmin(email)));
        admin.setActive(true);
        adminRepository.save(admin);

        Token token = new Token();
        token.setId("token-" + UUID.randomUUID());
        token.setAccountId(admin.getEmail());
        token.setRole("admin");
        token.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);
        return new Cookie("access_token", token.getId());
    }

    private Admin sampleAdmin(String email) {
        Admin admin = new Admin();
        admin.setEmail(email);
        admin.setName("Admin");
        admin.setSurname("Owner");
        // ✅ CORRECCIÓN: Contraseña de 12 caracteres (Secret#12345!)
        admin.setPassword("Secret#12345!"); 
        admin.setDepartment(Department.MODERATION);
        admin.setActive(true);
        return admin;
    }

    private ContentCreator sampleCreator(String email) {
        ContentCreator creator = new ContentCreator();
        creator.setEmail(email);
        creator.setName("Creator");
        creator.setSurname("Tester");
        creator.setAlias(email.split("@")[0]);
        // ✅ CORRECCIÓN: Contraseña de 12 caracteres (Creator#1234!)
        creator.setPassword("Creator#1234!"); 
        creator.setSpecialty(Specialty.MUSIC_CONCERTS);
        creator.setContentType(ContentType.VIDEO);
        creator.setActive(true);
        return creator;
    }

    private User sampleUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setName("User");
        user.setSurname("Test");
        user.setPassword("User#12345!"); // Contraseña de 12 caracteres
        return user;
    }
}