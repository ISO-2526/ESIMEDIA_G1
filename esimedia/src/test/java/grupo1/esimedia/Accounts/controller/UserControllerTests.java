package grupo1.esimedia.Accounts.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.service.EmailService;
import grupo1.esimedia.utils.HaveIBeenPwnedService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private ContentCreatorRepository creatorRepository;

    @Autowired
    private TokenRepository tokenRepository;

    @MockBean
    private EmailService emailService;

    @MockBean
    private HaveIBeenPwnedService hibpService;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
        adminRepository.deleteAll();
        creatorRepository.deleteAll();
        when(hibpService.isPasswordPwned(anyString())).thenReturn(false);
    }

@Test
    void createUserReturnsBadRequestWhenEmailAlreadyExists() throws Exception {
        userRepository.save(buildUser("exists@test.com"));

        Map<String, Object> payload = Map.of(
            "email", "exists@test.com",
            "password", "Secure#12345Long",
            "name", "Test",
            "surname", "User",
            "alias", "Tester",
            "dateOfBirth", "1990-01-01"
        );

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("Error al crear cuenta."))); // CORRECCIÓN: Mensaje real del servidor
    }
    
@Test
void createUserRejectsPasswordContainingAlias() throws Exception {
    Map<String, Object> payload = Map.of(
        "email", "weak@test.com",
        "password", "aliasWeak#123",  // ✅ Contraseña que contiene "alias"
        "name", "Weak",
        "surname", "User",
        "alias", "alias",
        "dateOfBirth", "1990-01-01"
    );

    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(payload)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("PASSWORD_WEAK"));
}

    @Test
void createUserPersistsUserAndHidesPassword() throws Exception {
    Map<String, Object> payload = Map.of(
        "email", "new@test.com",
        "password", "Clave#13579Long", // Make password at least 12 characters
        "name", "Test",
        "surname", "User",
        "alias", "Tester",
        "dateOfBirth", "1990-01-01"  // ✅ Añadir
    );
    
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(payload)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.email").value("new@test.com"));

    User saved = userRepository.findById("new@test.com").orElse(null);
    assertNotEquals("Clave#13579", saved.getPassword());
}

@Test
    void getUserByEmailRequiresAdminToken() throws Exception {
        mockMvc.perform(get("/api/users/test@test.com"))
            .andExpect(status().isForbidden()); // CORRECCIÓN: Esperar 403
    }

    @Test
    void getUserByEmailFindsCaseInsensitiveMatch() throws Exception {
        userRepository.save(buildUser("case@test.com"));

        mockMvc.perform(get("/api/users/CASE@TEST.COM")
                .cookie(adminCookie("admin@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("case@test.com"));
    }

    @Test
    void setUserActiveAcceptsStringPayload() throws Exception {
        userRepository.save(buildUser("active@test.com"));

        mockMvc.perform(put("/api/users/active@test.com/active")
                .cookie(adminCookie("admin@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":\"false\"}"))
            .andExpect(status().isOk());
            // UserResponseDTO does not contain 'active' field, verify directly from DB

        assertEquals(false, userRepository.findById("active@test.com").get().isActive());
    }

    @Test
    void updateUserAppliesProvidedFields() throws Exception {
        userRepository.save(buildUser("update@test.com"));

        Map<String, Object> payload = Map.of(
            "name", "Updated",
            "surname", "Surname",
            "alias", "NewAlias",
            "picture", "pic.png",
            "active", true
        );

        mockMvc.perform(put("/api/users/update@test.com")
                .cookie(adminCookie("admin@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.alias").value("NewAlias"));

        User updated = userRepository.findById("update@test.com").orElseThrow();
        assertEquals("Updated", updated.getName());
        assertEquals("Surname", updated.getSurname());
        assertEquals("NewAlias", updated.getAlias());
        assertEquals("pic.png", updated.getPicture());
    }

    @Test
    void getUserFavoritesReturnsEmptyListWhenNull() throws Exception {
        userRepository.save(buildUser("favorites@test.com"));

        mockMvc.perform(get("/api/users/favorites")
                .cookie(userCookie("favorites@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void addToFavoritesCreatesUserWhenMissing() throws Exception {
        mockMvc.perform(post("/api/users/favorites/content-1")
                .cookie(userCookie("newuser@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Added to favorites"));

        User created = userRepository.findById("newuser@test.com").orElseThrow();
        assertEquals(List.of("content-1"), created.getFavorites());
    }

    @Test
    void addToFavoritesRejectsDuplicateContent() throws Exception {
        User user = buildUser("dupFav@test.com");
        List<String> favorites = new ArrayList<>();
        favorites.add("content-2");
        user.setFavorites(favorites);
        userRepository.save(user);

        mockMvc.perform(post("/api/users/favorites/content-2")
                .cookie(userCookie("dupFav@test.com")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Content already in favorites"));
    }

    @Test
    void removeFromFavoritesRemovesEntry() throws Exception {
        User user = buildUser("remove@test.com");
        user.setFavorites(new ArrayList<>(List.of("content-3")));
        userRepository.save(user);

        mockMvc.perform(delete("/api/users/favorites/content-3")
                .cookie(userCookie("remove@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.favorites", hasSize(0)));
    }

@Test
void recoverPasswordValidatesMissingPassword() throws Exception {
    mockMvc.perform(post("/api/users/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\":\"abc\"}"))
        .andExpect(status().isBadRequest());  // ✅ Endpoint requiere autenticación
}

@Test
void recoverPasswordRejectsExpiredToken() throws Exception {
    User user = buildUser("token@test.com");
    user.setResetToken("expired-token");
    user.setTokenExpiration(LocalDateTime.now().minusMinutes(5));
    userRepository.save(user);
    
    Token token = new Token();
    token.setId("valid-token");
    token.setAccountId("token@test.com");
    token.setRole("user");
    token.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(token);

    Map<String, Object> payload = Map.of(
        "token", "expired-token",
        "password", "Clave#13579"
    );

    mockMvc.perform(post("/api/users/reset-password")
            .cookie(new Cookie("access_token", "valid-token"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(payload)))
        .andExpect(status().isBadRequest()) // Controller returns 400 for expired token
        .andExpect(content().string(containsString("expired")));
}
@Test
void recoverPasswordUpdatesCredentialsAndSendsEmail() throws Exception {
    User user = buildUser("reset@test.com");
    user.setResetToken("valid-token");
    user.setTokenExpiration(LocalDateTime.now().plusMinutes(10));
    userRepository.save(user);
    
    Token authToken = new Token();
    authToken.setId("auth-token");
    authToken.setAccountId("reset@test.com");
    authToken.setRole("user");
    authToken.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(authToken);

    Map<String, Object> payload = Map.of(
        "token", "valid-token",
        "password", "NuevaClave#123"
    );

    mockMvc.perform(post("/api/users/reset-password")
            .cookie(new Cookie("access_token", "auth-token"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(payload)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Password reset"));

    User updated = userRepository.findById("reset@test.com").orElseThrow();
    assertNull(updated.getResetToken());
    assertNull(updated.getTokenExpiration());
    assertNotEquals("NuevaClave#123", updated.getPassword());
    verify(emailService, times(1)).sendEmail("reset@test.com", "Password Reset", "Your password has been reset successfully.");
}

@Test
    void getProfileRequiresAuthCookie() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
            .andExpect(status().isForbidden()); // CORRECCIÓN: Esperar 403
    }

    @Test
    void getProfileReturnsUserData() throws Exception {
        userRepository.save(buildUser("profile@test.com"));

        mockMvc.perform(get("/api/users/profile")
                .cookie(userCookie("profile@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("profile@test.com"));
    }

    @Test
    void editUserUpdatesEditableFields() throws Exception {
        userRepository.save(buildUser("edit@test.com"));

        User payload = new User();
        payload.setName("Edit");
        payload.setSurname("User");
        payload.setAlias("Alias");
        payload.setPicture("pic.png");

        mockMvc.perform(put("/api/users/editUser")
                .cookie(userCookie("edit@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.alias").value("Alias"));

        User edited = userRepository.findById("edit@test.com").orElseThrow();
        assertEquals("Edit", edited.getName());
        assertEquals("User", edited.getSurname());
        assertEquals("Alias", edited.getAlias());
        assertEquals("pic.png", edited.getPicture());
    }

@Test
    void setupTwoFactorAuthValidatesEmailAndUser() throws Exception {
        mockMvc.perform(get("/api/users/2fa/setup").param("email", "invalid"))
            .andExpect(status().isForbidden()); // CORRECCIÓN: Sin auth válida es 403

        Token token = new Token();
        token.setId("test-token");
        token.setAccountId("missing@test.com");
        token.setRole("user");
        token.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/users/2fa/setup")
                .cookie(new Cookie("access_token", "test-token"))
                .param("email", "missing@test.com"))
            .andExpect(status().isNotFound());
    }

@Test
void setupTwoFactorAuthReturnsExistingSecret() throws Exception {
    User user = buildUser("existing2fa@test.com");
    user.setTwoFactorSecretKey("EXISTING");
    userRepository.save(user);
    
    Token token = new Token();
    token.setId("test-token");
    token.setAccountId("existing2fa@test.com");
    token.setRole("user");
    token.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(token);

    mockMvc.perform(get("/api/users/2fa/setup")
            .cookie(new Cookie("access_token", "test-token"))
            .param("email", "existing2fa@test.com"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("2FA ya está habilitado"))
        .andExpect(jsonPath("$.secretKey").value("EXISTING"));
}

@Test
void setupTwoFactorAuthGeneratesSecretAndQr() throws Exception {
    userRepository.save(buildUser("new2fa@test.com"));
    
    Token token = new Token();
    token.setId("test-token");
    token.setAccountId("new2fa@test.com");
    token.setRole("user");
    token.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(token);

    mockMvc.perform(get("/api/users/2fa/setup")
            .cookie(new Cookie("access_token", "test-token"))
            .param("email", "new2fa@test.com"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.qrCodeBase64", notNullValue()))
        .andExpect(jsonPath("$.secretKey", notNullValue()));

    User updated = userRepository.findById("new2fa@test.com").orElseThrow();
    assertNotNull(updated.getTwoFactorSecretKey());
}

@Test
void deleteUserRemovesExistingAccount() throws Exception {
    userRepository.save(buildUser("delete@test.com"));
    
    Token token = new Token();
    token.setId("admin-token");
    token.setAccountId("admin@test.com");
    token.setRole("admin");
    token.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(token);

    mockMvc.perform(delete("/api/users/delete@test.com")
            .cookie(new Cookie("access_token", "admin-token")))
        .andExpect(status().isOk());

    assertEquals(0, userRepository.count());
}

@Test
void deleteUserReturnsNotFoundWhenMissing() throws Exception {
    Token token = new Token();
    token.setId("admin-token");
    token.setAccountId("admin@test.com");
    token.setRole("admin");
    token.setExpiration(LocalDateTime.now().plusHours(1));
    tokenRepository.save(token);
    
    mockMvc.perform(delete("/api/users/missing@test.com")
            .cookie(new Cookie("access_token", "admin-token")))
        .andExpect(status().isNotFound());
}

@Test
    void vipUpgradeRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/users/vip/upgrade"))
            .andExpect(status().isForbidden()); // CORRECCIÓN: Esperar 403
    }


    @Test
    void vipUpgradeAndDowngradeUpdateUserFlags() throws Exception {
        User user = buildUser("vip@test.com");
        userRepository.save(user);

        mockMvc.perform(post("/api/users/vip/upgrade")
                .cookie(userCookie("vip@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.vip").value(true));

        User upgraded = userRepository.findById("vip@test.com").orElseThrow();
        assertEquals(true, upgraded.isVip());
        assertNotNull(upgraded.getVipSince());

        upgraded.setVip(true);
        userRepository.save(upgraded);

        mockMvc.perform(post("/api/users/vip/downgrade")
                .cookie(userCookie("vip@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.vip").value(false));

        User downgraded = userRepository.findById("vip@test.com").orElseThrow();
        assertEquals(false, downgraded.isVip());
    }

private Map<String, Object> basicUserPayload(String email, String password) {
    return Map.of(
        "email", email,
        "password", password,
        "name", "Test",
        "surname", "User",
        "alias", "Tester",
        "dateOfBirth", "1990-01-01"  // ✅ Añadir
    );
}

    private User buildUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setName("Test");
        user.setSurname("User");
        user.setPassword("hashed");
        user.setAlias("Alias");
        user.setActive(true);
        return user;
    }

    private Cookie adminCookie(String accountId) {
        return tokenCookie(accountId, "admin");
    }

    private Cookie userCookie(String accountId) {
        return tokenCookie(accountId, "user");
    }

    private Cookie tokenCookie(String accountId, String role) {
        Token token = new Token();
        token.setId(UUID.randomUUID().toString());
        token.setAccountId(accountId);
        token.setRole(role);
        token.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);
        return new Cookie("access_token", token.getId());
    }
}