package com.esimedia;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.esimedia.accounts.model.Admin;
import com.esimedia.accounts.model.Department;
import com.esimedia.accounts.model.Token;
import com.esimedia.accounts.model.User;
import com.esimedia.accounts.repository.AdminRepository;
import com.esimedia.accounts.repository.TokenRepository;
import com.esimedia.accounts.repository.UserRepository;
import com.esimedia.accounts.service.EmailService;
import com.esimedia.accounts.service.ThreeFactorAuthService;
import com.esimedia.accounts.service.TwoFactorAuthService;
import com.esimedia.security.LoginAttemptService;
import com.esimedia.security.RateLimitService;
import com.esimedia.utils.PasswordUtils;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EsimediaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private PasswordUtils passwordUtils;

    @MockBean
    private EmailService emailService;

    @MockBean
    private TwoFactorAuthService twoFactorAuthService;

    @MockBean
    private ThreeFactorAuthService threeFactorAuthService;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        adminRepository.deleteAll();
        tokenRepository.deleteAll();

        when(rateLimitService.allowLogin(anyString(), anyString())).thenReturn(true);
        when(loginAttemptService.isLocked(anyString(), anyString())).thenReturn(false);
        when(loginAttemptService.isDistributedAttack(anyString())).thenReturn(false);
        when(loginAttemptService.getRemainingAttempts(anyString(), anyString())).thenReturn(5);
        when(loginAttemptService.getLockoutTime(anyString(), anyString())).thenReturn(0L);
        when(twoFactorAuthService.validateCode(anyString(), anyInt())).thenReturn(true);
        when(threeFactorAuthService.validateVerificationCode(anyString(), anyString())).thenReturn(true);
        doNothing().when(loginAttemptService).recordFailedAttempt(anyString(), anyString());
    }

    @Test
    void loginSuccessForUser() throws Exception {
        User user = new User();
        user.setName("Demo");
        user.setSurname("User");
        user.setEmail("user@test.com");
        user.setPassword(passwordUtils.hashPassword("password123"));
        user.setActive(true);
        userRepository.save(user);

        mockMvc.perform(jsonPost("/api/auth/login", "{\"email\":\"user@test.com\",\"password\":\"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("user"))
            .andExpect(jsonPath("$.email").value("user@test.com"))
            .andExpect(cookie().exists("access_token"));
    }


    @Test
    void loginRequiresTwoFactorWhenSecretPresent() throws Exception {
        User user = new User();
        user.setName("Two");
        user.setSurname("Factor");
        user.setEmail("2fa@test.com");
        user.setPassword(passwordUtils.hashPassword("password123"));
        user.setTwoFactorSecretKey("SECRET");
        userRepository.save(user);

        mockMvc.perform(jsonPost("/api/auth/login", "{\"email\":\"2fa@test.com\",\"password\":\"password123\"}"))
            .andExpect(status().isPreconditionRequired())
            .andExpect(jsonPath("$.requiresTwoFactor").value(true));
    }

    @Test
    void getAdminByEmailWithValidToken() throws Exception {
        Admin admin = new Admin();
        admin.setName("Admin");
        admin.setSurname("User");
        admin.setEmail("admin@test.com");
        admin.setPassword(passwordUtils.hashPassword("adminpass"));
        admin.setDepartment(Department.LEGAL_TEAM);
        adminRepository.save(admin);

        Token token = new Token();
        token.setId("token-123");
        token.setRole("admin");
        token.setAccountId("admin@test.com");
        token.setExpiration(LocalDateTime.now().plusHours(2));
        tokenRepository.save(token);

        mockMvc.perform(get("/api/admins/admin@test.com").cookie(new MockCookie("access_token", "token-123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("admin@test.com"));
    }

    @Test
    void getAdminByEmailUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admins/admin@test.com"))
            .andExpect(status().isForbidden());
    }

    private MockHttpServletRequestBuilder jsonPost(String url, String jsonBody) {
        return post(url)
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonBody)
            .header("User-Agent", "JUnit")
            .with(request -> {
                request.setRemoteAddr("127.0.0.1");
                return request;
            });
    }
}


