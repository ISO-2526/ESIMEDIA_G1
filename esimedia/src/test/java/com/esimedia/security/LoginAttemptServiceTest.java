package com.esimedia.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.esimedia.config.PasswordSecurityConfig;

class LoginAttemptServiceTest {

    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        service = new LoginAttemptService();

        PasswordSecurityConfig securityConfig = new PasswordSecurityConfig();
        ReflectionTestUtils.setField(securityConfig, "maxLoginAttempts", 3);
        ReflectionTestUtils.setField(securityConfig, "lockoutMinutes", 1);
        ReflectionTestUtils.setField(securityConfig, "attemptWindowMinutes", 30);

        ReflectionTestUtils.setField(service, "securityConfig", securityConfig);
    }

    @Test
    void recordFailedAttemptLocksAccountAfterMaxAttempts() {
        String email = "user@test.com";
        String ip = "127.0.0.1";

        service.recordFailedAttempt(email, ip);
        service.recordFailedAttempt(email, ip);
        service.recordFailedAttempt(email, ip);

        assertTrue(service.isLocked(email, ip));
        assertTrue(service.getLockoutTime(email, ip) > 0);
    }

    @Test
    void getRemainingAttemptsReflectsCurrentState() {
        String email = "user@test.com";
        String ip = "127.0.0.1";

        service.recordFailedAttempt(email, ip);

        assertEquals(2, service.getRemainingAttempts(email, ip));
    }

    @Test
    void resetAttemptsClearsUserAndGlobalState() {
        String email = "reset@test.com";
        String ip = "10.0.0.1";

        service.recordFailedAttempt(email, ip);
        service.recordFailedAttempt(email, ip);
        assertTrue(service.getGlobalAttemptsForEmail(email) > 0);

        service.resetAttempts(email, ip);

        assertFalse(service.isLocked(email, ip));
        assertEquals(0, service.getGlobalAttemptsForEmail(email));
    }

    @Test
    void distributedAttackDetectionTriggersAfterThreshold() {
        String email = "attack@test.com";

        for (int i = 0; i < 10; i++) {
            String ip = "10.0.0." + i;
            service.recordFailedAttempt(email, ip);
        }

        assertTrue(service.isDistributedAttack(email));
        assertTrue(service.getGlobalAttemptsForEmail(email) > 9);
    }
}
