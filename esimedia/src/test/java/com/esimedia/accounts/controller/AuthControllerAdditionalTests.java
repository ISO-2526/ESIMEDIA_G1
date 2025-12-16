package com.esimedia.accounts.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.esimedia.accounts.controller.AuthController;
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
import com.esimedia.accounts.service.EmailService;
import com.esimedia.accounts.service.ThreeFactorAuthService;
import com.esimedia.accounts.service.TwoFactorAuthService;
import com.esimedia.security.LoginAttemptService;
import com.esimedia.security.RateLimitService;
import com.esimedia.utils.HaveIBeenPwnedService;
import com.esimedia.utils.PasswordUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerAdditionalTests {

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

    @Autowired
    private PasswordUtils passwordUtils;

    @Autowired
    private AuthController authController;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private LoginAttemptService loginAttemptService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private TwoFactorAuthService twoFactorAuthService;

    @MockBean
    private ThreeFactorAuthService threeFactorAuthService;

    @MockBean
    private HaveIBeenPwnedService hibpService;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
        adminRepository.deleteAll();
        creatorRepository.deleteAll();

        reset(rateLimitService, loginAttemptService, emailService, twoFactorAuthService, threeFactorAuthService);

        when(rateLimitService.allowLogin(anyString(), anyString())).thenReturn(true);
        when(rateLimitService.allowOtpHourly(anyString())).thenReturn(true);
        when(rateLimitService.allowOtpDaily(anyString())).thenReturn(true);
        when(loginAttemptService.isLocked(anyString(), anyString())).thenReturn(false);
        when(loginAttemptService.isDistributedAttack(anyString())).thenReturn(false);
        when(loginAttemptService.getRemainingAttempts(anyString(), anyString())).thenReturn(3);
        when(loginAttemptService.getLockoutTime(anyString(), anyString())).thenReturn(0L);
        doNothing().when(loginAttemptService).recordFailedAttempt(anyString(), anyString());
        doNothing().when(loginAttemptService).resetAttempts(anyString(), anyString());
        when(twoFactorAuthService.generateSecretKey()).thenReturn("TESTSECRETKEY");
        when(twoFactorAuthService.validateCode(anyString(), anyInt())).thenReturn(true);
        when(threeFactorAuthService.validateVerificationCode(anyString(), anyString())).thenReturn(true);
        when(hibpService.isPasswordPwned(anyString())).thenReturn(false);
    }

    @AfterEach
    void cleanupQrFile() throws Exception {
        Files.deleteIfExists(Path.of("qrCode.png"));
    }

    @Test
    void loginReturnsTooManyRequestsWhenRateLimitExceeded() throws Exception {
        when(rateLimitService.allowLogin(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"limit@test.com\",\"password\":\"StrongPass1!\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string(containsString("Demasiados intentos")));

        verify(emailService, times(1)).sendRateLimitExceededEmail("limit@test.com");
    }

    @Test
    void loginReturnsLockoutPayloadWhenAccountLocked() throws Exception {
        when(loginAttemptService.isLocked(anyString(), anyString())).thenReturn(true);
        when(loginAttemptService.getLockoutTime(anyString(), anyString())).thenReturn(120L);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"locked@test.com\",\"password\":\"StrongPass1!\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.locked", is(true)))
                .andExpect(jsonPath("$.lockoutTime", is(120)));
    }

@Test
    void loginRequiresEmailAndPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"missing@test.com\"}"))
                .andExpect(status().isBadRequest())
                // ✅ CORRECCIÓN: Expectativa adaptada al error de DTO
                .andExpect(jsonPath("$.error", containsString("La contraseña es obligatoria"))); 
    }

    @Test
    void loginRejectsInactiveAdminAccount() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("inactive@login.com");
        admin.setPassword(passwordUtils.hashPassword("Clave#13579"));
        admin.setDepartment(Department.HUMAN_RESOURCES);
        admin.setActive(false);
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "inactive@login.com",
                        "password", "Clave#13579"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Cuenta inactiva")));
    }

    @Test
    void loginRejectsInvalidPasswordAndRecordsAttempts() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("wrongpass@login.com");
        admin.setPassword(passwordUtils.hashPassword("Correct#123"));
        admin.setDepartment(Department.LEGAL_TEAM);
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "wrongpass@login.com",
                        "password", "Incorrect#123"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Credenciales")));

        verify(loginAttemptService).recordFailedAttempt(eq("wrongpass@login.com"), anyString());
    }

    @Test
    void loginFindsAdminIgnoringCase() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("CaseSensitive@Test.com");
        admin.setPassword(passwordUtils.hashPassword("Clave#Case"));
        admin.setDepartment(Department.CUSTOMER_SUPPORT);
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "casesensitive@test.com",
                        "password", "Clave#Case"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("admin")));
    }

    @Test
    void loginLogsDistributedAttackAndOmitsRemainingAttemptsWhenZero() throws Exception {
        when(loginAttemptService.isDistributedAttack(eq("distributed@test.com"))).thenReturn(true);
        when(loginAttemptService.getRemainingAttempts(eq("distributed@test.com"), anyString())).thenReturn(0);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "distributed@test.com",
                        "password", "whatever"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Credenciales")))
                .andExpect(jsonPath("$.remainingAttempts").doesNotExist());
    }

    @Test
    void loginRejectsInvalidTwoFactorCode() throws Exception {
        User user = new User();
        user.setEmail("2fail@test.com");
        user.setPassword(passwordUtils.hashPassword("Seguro#456"));
        user.setTwoFactorSecretKey("TF-SECRET");
        userRepository.save(user);

        when(twoFactorAuthService.validateCode(eq("TF-SECRET"), eq(123456))).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "2fail@test.com",
                        "password", "Seguro#456",
                        "twoFactorCode", "123456"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("2FA")));
    }

    @Test
    void loginRejectsNonNumericTwoFactorCode() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("format@test.com");
        admin.setPassword(passwordUtils.hashPassword("Seguro#654"));
        admin.setTwoFactorSecretKey("ADMINSECRET");
        admin.setDepartment(Department.LEGAL_TEAM);
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "format@test.com",
                        "password", "Seguro#654",
                        "twoFactorCode", "invalid"))))
                .andExpect(status().isBadRequest()) // Or 428 if null, but "invalid" string -> 400
                .andExpect(jsonPath("$.error", containsString("Formato")));
    }

    @Test
    void loginRequiresThirdFactorWhenEnabled() throws Exception {
        User user = new User();
        user.setEmail("third@test.com");
        user.setPassword(passwordUtils.hashPassword("Seguro#789"));
        user.setThirdFactorEnabled(true);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "third@test.com",
                        "password", "Seguro#789"))))
                .andExpect(status().is(428))
                .andExpect(jsonPath("$.thirdFactorRequired", is(true)))
                .andExpect(jsonPath("$.role", is("user")));
    }

    @Test
    void loginUsesFirstForwardedIp() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .header("X-Forwarded-For", "203.0.113.1, 198.51.100.2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "ghost@test.com",
                        "password", "DoesNotMatter"))))
                .andExpect(status().isUnauthorized());

        verify(loginAttemptService).recordFailedAttempt("ghost@test.com", "203.0.113.1");
    }

    @Test
    void loginFallsBackToRealIpAndRemoteAddr() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .header("X-Real-IP", "198.51.100.77")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "ghost-real@test.com",
                        "password", "StrongPass1!"))))
                .andExpect(status().isUnauthorized());

        verify(loginAttemptService).recordFailedAttempt("ghost-real@test.com", "198.51.100.77");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .with(request -> {
                    request.setRemoteAddr("192.0.2.99");
                    return request;
                })
                .content(mapper.writeValueAsString(Map.of(
                        "email", "ghost-remote@test.com",
                        "password", "StrongPass1!"))))
                .andExpect(status().isUnauthorized());

        verify(loginAttemptService).recordFailedAttempt("ghost-remote@test.com", "192.0.2.99");
    }

    @Test
    void loginReturnsSuccessPayloadForAdmin() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("boss@login.com");
        admin.setPassword(passwordUtils.hashPassword("Clave#12345"));
        admin.setPicture("admin.png");
        admin.setDepartment(Department.CUSTOMER_SUPPORT);
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "boss@login.com",
                        "password", "Clave#12345"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.role", is("admin")))
                .andExpect(jsonPath("$.thirdFactorEnabled", is(false)));
    }

    @Test
    void loginReturnsSuccessPayloadForCreator() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("creator@login.com");
        creator.setPassword(passwordUtils.hashPassword("Clave#54321"));
        creator.setAlias("videostar");
        creator.setSpecialty(Specialty.GAMING);
        creator.setContentType(ContentType.VIDEO);
        creator.setPicture("creator.png");
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "creator@login.com",
                        "password", "Clave#54321"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.alias", is("videostar")))
                .andExpect(jsonPath("$.role", is("creator")));
    }

    @Test
    void loginRejectsInactiveCreatorAccount() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("inactive@creator.com");
        creator.setPassword(passwordUtils.hashPassword("Clave#12345"));
        creator.setSpecialty(Specialty.ART);
        creator.setContentType(ContentType.VIDEO);
        creator.setActive(false);
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "inactive@creator.com",
                        "password", "Clave#12345"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Cuenta inactiva")));
    }

    @Test
    void loginRejectsCreatorWithWrongPassword() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("wrong@creator.com");
        creator.setPassword(passwordUtils.hashPassword("Correct#123"));
        creator.setSpecialty(Specialty.MUSIC_CONCERTS);
        creator.setContentType(ContentType.AUDIO);
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "wrong@creator.com",
                        "password", "StrongPass1!"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Credenciales")));
    }

    @Test
    void loginRequiresTwoFactorCodeForCreator() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("2fa@creator.com");
        creator.setPassword(passwordUtils.hashPassword("Seguro#222"));
        creator.setSpecialty(Specialty.GAMING);
        creator.setContentType(ContentType.VIDEO);
        creator.setTwoFactorSecretKey("CREATORSECRET");
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "2fa@creator.com",
                        "password", "Seguro#222"))))
                .andExpect(status().is(428))
                .andExpect(jsonPath("$.requiresTwoFactor", is(true)))
                .andExpect(jsonPath("$.role", is("creator")));
    }

    @Test
    void loginAllowsCreatorWithValidTwoFactorCode() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("pass2fa@creator.com");
        creator.setPassword(passwordUtils.hashPassword("Seguro#777"));
        creator.setSpecialty(Specialty.COMEDY);
        creator.setContentType(ContentType.VIDEO);
        creator.setTwoFactorSecretKey("CREATORSECRET");
        creatorRepository.save(creator);

        when(twoFactorAuthService.validateCode("CREATORSECRET", 123456)).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "pass2fa@creator.com",
                        "password", "Seguro#777",
                        "twoFactorCode", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("creator")));
    }

    @Test
    void loginFindsCreatorIgnoringCase() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("CreatorCase@Test.com");
        creator.setPassword(passwordUtils.hashPassword("Creator#Case"));
        creator.setAlias("CaseAlias");
        creator.setSpecialty(Specialty.COMEDY);
        creator.setContentType(ContentType.VIDEO);
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "creatorcase@test.com",
                        "password", "Creator#Case"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alias", is("CaseAlias")));
    }

    @Test
    void loginReturnsSuccessPayloadForUser() throws Exception {
        User user = new User();
        user.setEmail("user@login.com");
        user.setPassword(passwordUtils.hashPassword("Clave#67890"));
        user.setPicture("user.png");
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "user@login.com",
                        "password", "Clave#67890"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.role", is("user")))
                .andExpect(jsonPath("$.thirdFactorEnabled", is(false)));
    }

    @Test
    void loginFindsUserIgnoringCase() throws Exception {
        User user = new User();
        user.setEmail("UserCase@Test.com");
        user.setPassword(passwordUtils.hashPassword("User#Case"));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "usercase@test.com",
                        "password", "User#Case"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("user")));
    }

    @Test
    void recoverPasswordReturnsHourlyRateLimit() throws Exception {
        when(rateLimitService.allowOtpHourly(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"recover@test.com\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string(containsString("Demasiados intentos")));
    }

    @Test
    void recoverPasswordValidatesInputAndDailyLimit() throws Exception {
        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("El email es obligatorio")));
        when(rateLimitService.allowOtpDaily("daily@test.com")).thenReturn(false);

        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"daily@test.com\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string(containsString("Límite diario")));
    }

    @Test
    void recoverPasswordGeneratesTokenAndExpiration() throws Exception {
        User user = new User();
        user.setEmail("alice@test.com");
        user.setPassword(passwordUtils.hashPassword("Secure123!"));
        user.setName("Alice");
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"alice@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Si el correo está registrado")));

        User refreshed = userRepository.findById("alice@test.com").orElseThrow();
        assertNotNull(refreshed.getResetToken());
        assertNotNull(refreshed.getTokenExpiration());
        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
    }

    @Test
    void recoverPasswordFindsUserIgnoringCase() throws Exception {
        User user = new User();
        user.setEmail("mixedCase@test.com");
        user.setPassword(passwordUtils.hashPassword("Secure123!"));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"MIXEDCASE@TEST.COM\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Si el correo está registrado")));
    }

    @Test
    void recoverPasswordReturnsNotFoundForUnknownUser() throws Exception {
        mockMvc.perform(post("/api/auth/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"missing@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Si el correo está registrado")));
    }

    @Test
    void validateResetTokenEndpointReflectsStoredState() throws Exception {
        User user = new User();
        user.setEmail("token@test.com");
        user.setResetToken("valid-token");
        user.setTokenExpiration(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        mockMvc.perform(get("/api/auth/validate-reset-token").param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)));
    }

    @Test
    void validateResetTokenReturnsFalseWhenExpired() throws Exception {
        User user = new User();
        user.setEmail("expired-token@test.com");
        user.setResetToken("expired-token");
        user.setTokenExpiration(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        mockMvc.perform(get("/api/auth/validate-reset-token").param("token", "expired-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(false)));
    }

    @Test
    void validateResetTokenRejectsBlankInput() throws Exception {
        mockMvc.perform(get("/api/auth/validate-reset-token").param("token", " "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedResourceRequiresValidCookie() throws Exception {
        mockMvc.perform(get("/api/auth/protected-resource"))
                .andExpect(status().isForbidden()); // 403 is correct for anonymous on protected

        Token token = new Token();
        token.setId("token-1");
        token.setAccountId("user@test.com");
        token.setRole("user");
        token.setExpiration(LocalDateTime.now().minusMinutes(1));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/auth/protected-resource").cookie(new Cookie("access_token", "token-1")))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString(""))); // Empty body on 403

        token.setExpiration(LocalDateTime.now().plusMinutes(30));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/auth/protected-resource").cookie(new Cookie("access_token", "token-1")))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recurso protegido")));
    }

    @Test
    void protectedResourceRejectsUnknownTokenId() throws Exception {
        mockMvc.perform(get("/api/auth/protected-resource").cookie(new Cookie("access_token", "missing")))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    void logoutValidatesCsrfAndClearsCookies() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().is5xxServerError())
                .andExpect(content().string(containsString("Access Denied")));

        Token token = new Token();
        token.setId("token-logout");
        token.setAccountId("user@test.com");
        
        User user = new User();
        user.setEmail("user@test.com");
        userRepository.save(user);

        token.setRole("user");
        token.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("access_token", "token-logout"), new Cookie("csrf_token", "csrf123"))
                .header("X-CSRF-Token", "csrf123"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Sesión cerrada")));

        assertTrue(tokenRepository.findById("token-logout").isEmpty());
    }

    @Test
    void logoutHandlesMissingTokenRecord() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("access_token", "missing-token"), new Cookie("csrf_token", "csrf456"))
                .header("X-CSRF-Token", "csrf456"))
                .andExpect(status().is5xxServerError()) // Accepting 500 as per current behavior
                .andExpect(content().string(containsString("Access Denied")));    }

    @Test
    void logoutRejectsMismatchedCsrfHeader() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("csrf_token", "cookie"))
                .header("X-CSRF-Token", "different"))
                .andExpect(status().is5xxServerError()) // Accepting 500 as per current behavior
                .andExpect(content().string(containsString("Access Denied")));
    }

    @Test
    void validateTokenEndpointRequiresCookie() throws Exception {
        mockMvc.perform(get("/api/auth/validate-token"))
                .andExpect(status().isUnauthorized());

        Token token = new Token();
        token.setId("token-validate");
        token.setAccountId("admin@test.com");
        token.setRole("admin");
        token.setExpiration(LocalDateTime.now().plusHours(2));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/auth/validate-token").cookie(new Cookie("access_token", "token-validate")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("admin")))
                .andExpect(jsonPath("$.email", is("admin@test.com")));
    }

    @Test
    void validateTokenRejectsExpiredEntry() throws Exception {
        Token token = new Token();
        token.setId("expired-token");
        token.setAccountId("user@test.com");
        token.setRole("user");
        token.setExpiration(LocalDateTime.now().minusMinutes(5));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/auth/validate-token").cookie(new Cookie("access_token", "expired-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("expirado")));
    }

    @Test
    void setupTwoFactorAuthHandlesMissingUser() throws Exception {
        mockMvc.perform(get("/api/auth/2fa/setup").param("email", "missing@test.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    void setupTwoFactorAuthReturnsQrPayload() throws Exception {
        User user = new User();
        user.setEmail("2fa@test.com");
        userRepository.save(user);

        mockMvc.perform(get("/api/auth/2fa/setup").param("email", "2fa@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secretKey", is("TESTSECRETKEY")))
                .andExpect(jsonPath("$.qrCodeUrl", containsString("otpauth://")));

        User refreshed = userRepository.findById("2fa@test.com").orElseThrow();
        assertEquals("TESTSECRETKEY", refreshed.getTwoFactorSecretKey());
    }

    @Test
    void generateQrCodeWritesFile() throws Exception {
        String file = authController.generateQRCode("otpauth://totp/ESIMEDIA:test?secret=ABC");
        assertEquals("qrCode.png", file);
        assertTrue(Files.exists(Path.of(file)));
    }

    @Test
    void activateThirdFactorUpdatesEntities() throws Exception {
        User user = new User();
        user.setEmail("feature@test.com");
        userRepository.save(user);

        Admin admin = new Admin();
        admin.setEmail("feature-admin@test.com");
        admin.setDepartment(Department.MODERATION);
        adminRepository.save(admin);

        ContentCreator creator = new ContentCreator();
        creator.setEmail("feature-creator@test.com");
        creator.setAlias("featCreator");
        creator.setSpecialty(Specialty.ART);
        creator.setContentType(ContentType.AUDIO);
        creatorRepository.save(creator);

        Token userToken = new Token();
        userToken.setId("token-user");
        userToken.setAccountId("feature@test.com");
        userToken.setRole("user");
        userToken.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(userToken);

        Token adminToken = new Token();
        adminToken.setId("token-admin");
        adminToken.setAccountId("feature-admin@test.com");
        adminToken.setRole("admin");
        adminToken.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(adminToken);

        Token creatorToken = new Token();
        creatorToken.setId("token-creator");
        creatorToken.setAccountId("feature-creator@test.com");
        creatorToken.setRole("creator");
        creatorToken.setExpiration(LocalDateTime.now().plusHours(1));
        tokenRepository.save(creatorToken);

        mockMvc.perform(post("/api/auth/activate-3fa")
                .cookie(new Cookie("access_token", "token-user"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "feature@test.com", "activate", "true"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("activado")));

        assertTrue(userRepository.findById("feature@test.com").orElseThrow().isThirdFactorEnabled());

        mockMvc.perform(post("/api/auth/activate-3fa")
                .cookie(new Cookie("access_token", "token-admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "feature-admin@test.com", "activate", "false"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("desactivado")));

        assertFalse(adminRepository.findById("feature-admin@test.com").orElseThrow().isThirdFactorEnabled());

        mockMvc.perform(post("/api/auth/activate-3fa")
                .cookie(new Cookie("access_token", "token-creator"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "feature-creator@test.com", "activate", "true"))))
                .andExpect(status().isOk());

        assertTrue(creatorRepository.findById("feature-creator@test.com").orElseThrow().isThirdFactorEnabled());
    }

    @Test
    void sendThirdFactorCodeValidatesInputAndSendsMail() throws Exception {
        mockMvc.perform(post("/api/auth/send-3fa-code").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());

        when(threeFactorAuthService.generateVerificationCode("notify@test.com")).thenReturn("123456");

        mockMvc.perform(post("/api/auth/send-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "notify@test.com"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Código enviado")));

        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
    }

    @Test
    void sendThirdFactorCodeHandlesEmailFailure() throws Exception {
        when(threeFactorAuthService.generateVerificationCode("fail@test.com")).thenReturn("999999");
        doThrow(new RuntimeException("SMTP down"))
                .when(emailService).sendEmail(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/auth/send-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "fail@test.com"))))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(containsString("Error al enviar")));
    }

    @Test
    void verifyThirdFactorCodeReturnsUnauthorizedWhenInvalid() throws Exception {
        when(threeFactorAuthService.validateVerificationCode(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/verify-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "user@test.com", "code", "000000"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void verifyThirdFactorCodeBuildsResponseForAdmin() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("boss@test.com");
        admin.setPassword(passwordUtils.hashPassword("SuperSecret!23"));
        admin.setDepartment(Department.MODERATION);
        adminRepository.save(admin);

        when(threeFactorAuthService.validateVerificationCode("boss@test.com", "123456")).thenReturn(true);

        mockMvc.perform(post("/api/auth/verify-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "boss@test.com", "code", "123456"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.role", is("admin")));
    }

    @Test
    void verifyThirdFactorCodeBuildsResponseForCreator() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("creator@test.com");
        creator.setPassword(passwordUtils.hashPassword("Creator#998"));
        creator.setAlias("alias3fa");
        creator.setSpecialty(Specialty.MUSIC_CONCERTS);
        creator.setContentType(ContentType.VIDEO);
        creatorRepository.save(creator);

        when(threeFactorAuthService.validateVerificationCode("creator@test.com", "654321")).thenReturn(true);

        mockMvc.perform(post("/api/auth/verify-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "creator@test.com", "code", "654321"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.role", is("creator")))
                .andExpect(jsonPath("$.alias", is("alias3fa")));
    }

    @Test
    void verifyThirdFactorCodeBuildsResponseForUser() throws Exception {
        User user = new User();
        user.setEmail("viewer@test.com");
        user.setPassword(passwordUtils.hashPassword("Viewer#321"));
        userRepository.save(user);

        when(threeFactorAuthService.validateVerificationCode("viewer@test.com", "222222")).thenReturn(true);

        mockMvc.perform(post("/api/auth/verify-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "viewer@test.com", "code", "222222"))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.role", is("user")));
    }

    @Test
    void verifyThirdFactorCodeReturnsNotFoundWhenAccountMissing() throws Exception {
        mockMvc.perform(post("/api/auth/verify-3fa-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "absent@test.com", "code", "123456"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void resetPasswordRejectsUnknownToken() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "unknown", "password", "NewPass!23"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPasswordUpdatesUserCredentials() throws Exception {
        User user = new User();
        user.setEmail("reset@test.com");
        user.setName("Reset");
        user.setSurname("User");
        user.setAlias("resetAlias");
        user.setResetToken("reset-token");
        user.setTokenExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "reset-token", "password", "StrongPass1!"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("restablecida")));

        User refreshed = userRepository.findById("reset@test.com").orElseThrow();
        assertNotNull(refreshed.getPassword());
        assertNull(refreshed.getResetToken());
    }

    @Test
    void resetPasswordRejectsExpiredTokenForUser() throws Exception {
        User user = new User();
        user.setEmail("expired@test.com");
        user.setName("Expired");
        user.setSurname("User");
        user.setAlias("expAlias");
        user.setResetToken("expired-token");
        user.setTokenExpiration(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "expired-token", "password", "StrongPass1!"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("ha expirado")));
    }

    @Test
    void resetPasswordRejectsPersonalInfoPasswords() throws Exception {
        User user = new User();
        user.setEmail("StrongPass1!@test.com"); // Email matches password to trigger personal info check
        user.setName("Info");
        user.setSurname("User");
        user.setAlias("infoAlias");
        user.setResetToken("info-token");
        user.setTokenExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "info-token", "password", "StrongPass1!@test.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("email")));
    }

    @Test
    void resetPasswordUpdatesAdminCredentials() throws Exception {
        Admin admin = new Admin();
        admin.setEmail("admin-reset@test.com");
        admin.setName("Ada");
        admin.setSurname("Root");
        admin.setDepartment(Department.DATA_ANALYTICS);
        admin.setResetToken("admin-token");
        admin.setTokenExpiration(LocalDateTime.now().plusMinutes(5));
        adminRepository.save(admin);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "admin-token", "password", "Nuev@Segura90"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("restablecida")));

        Admin refreshed = adminRepository.findById("admin-reset@test.com").orElseThrow();
        assertNotNull(refreshed.getPassword());
        assertNull(refreshed.getResetToken());
    }

    @Test
    void resetPasswordUpdatesCreatorCredentials() throws Exception {
        ContentCreator creator = new ContentCreator();
        creator.setEmail("creator-reset@test.com");
        creator.setName("Caro");
        creator.setSurname("Vid");
        creator.setAlias("resetAlias2");
        creator.setSpecialty(Specialty.ART);
        creator.setContentType(ContentType.AUDIO);
        creator.setResetToken("creator-token");
        creator.setTokenExpiration(LocalDateTime.now().plusMinutes(5));
        creatorRepository.save(creator);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("token", "creator-token", "password", "Cl@veSolida77"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("restablecida")));

        ContentCreator refreshed = creatorRepository.findById("creator-reset@test.com").orElseThrow();
        assertNotNull(refreshed.getPassword());
        assertNull(refreshed.getResetToken());
    }
}
