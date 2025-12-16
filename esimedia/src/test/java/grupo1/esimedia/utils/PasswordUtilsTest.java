package grupo1.esimedia.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.esimedia.config.PasswordSecurityConfig;
import com.esimedia.utils.HaveIBeenPwnedService;
import com.esimedia.utils.PasswordUtils;

class PasswordUtilsTest {

    private PasswordUtils passwordUtils;
    private HaveIBeenPwnedService hibpService;

    @BeforeEach
    void setUp() {
        passwordUtils = new PasswordUtils();
        hibpService = mock(HaveIBeenPwnedService.class);

        PasswordSecurityConfig securityConfig = new PasswordSecurityConfig();
        ReflectionTestUtils.setField(securityConfig, "passwordPepper", "UNIT_TEST_PEPPER");
        ReflectionTestUtils.setField(securityConfig, "bcryptRounds", 10);
        ReflectionTestUtils.setField(securityConfig, "maxLoginAttempts", 5);
        ReflectionTestUtils.setField(securityConfig, "lockoutMinutes", 15);
        ReflectionTestUtils.setField(securityConfig, "attemptWindowMinutes", 30);

        ReflectionTestUtils.setField(passwordUtils, "securityConfig", securityConfig);
        ReflectionTestUtils.setField(passwordUtils, "hibpService", hibpService);
        ReflectionTestUtils.setField(passwordUtils, "environment", "production");
        ReflectionTestUtils.setField(passwordUtils, "checkHibp", true);

        when(hibpService.isPasswordPwned(anyString())).thenReturn(false);
    }

    @Test
    void validatePasswordPersonalInfoDetectsPersonalData() {
        List<String> errors = passwordUtils.validatePasswordPersonalInfo(
            "SuperAna123", "ana.romero@example.com", "Ana", "Romero", null);

        assertFalse(errors.isEmpty(), "Expected validation errors when password contains personal data");
        assertTrue(errors.stream().anyMatch(error -> error.contains("nombre")),
            "Expected error referencing the user's name");
    }

    @Test
    void validatePasswordPersonalInfoStopsWhenPasswordIsPwned() {
        when(hibpService.isPasswordPwned("Compromised!123")).thenReturn(true);

        List<String> errors = passwordUtils.validatePasswordPersonalInfo(
            "Compromised!123", "user@test.com", "User", "Test", null);

        assertEquals(1, errors.size());
        assertTrue(errors.get(0).contains("comprometida"));
    }

    @Test
    void hashAndVerifyPasswordRoundTripSucceeds() {
        String hash = passwordUtils.hashPassword("Sup3r$ecretPwd!");

        assertNotNull(hash);
        assertTrue(passwordUtils.verifyPassword("Sup3r$ecretPwd!", hash));
        assertFalse(passwordUtils.verifyPassword("WrongPassword", hash));
    }
}
