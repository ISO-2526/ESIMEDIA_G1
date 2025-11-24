package grupo1.esimedia.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RateLimitServiceTest {

    private RateLimitService service;

    @BeforeEach
    void setUp() {
        service = new RateLimitService();
    }

    @Test
    void allowLoginConsumesTokensPerIpAndEmail() {
        String ip = "192.168.1.10";
        String email = "rate@test.com";

        assertTrue(service.allowLogin(ip, email));
        assertTrue(service.allowLogin(ip, email));
        assertTrue(service.allowLogin(ip, email));
        assertTrue(service.allowLogin(ip, email));
        assertTrue(service.allowLogin(ip, email));
        assertFalse(service.allowLogin(ip, email));
    }

    @Test
    void allowOtpHourlyLimitsToThreeRequests() {
        String email = "otp-hour@test.com";

        assertTrue(service.allowOtpHourly(email));
        assertTrue(service.allowOtpHourly(email));
        assertTrue(service.allowOtpHourly(email));
        assertFalse(service.allowOtpHourly(email));
    }

    @Test
    void allowOtpDailyLimitsToTenRequests() {
        String email = "otp-day@test.com";

        for (int i = 0; i < 10; i++) {
            assertTrue(service.allowOtpDaily(email));
        }

        assertFalse(service.allowOtpDaily(email));
    }
}
