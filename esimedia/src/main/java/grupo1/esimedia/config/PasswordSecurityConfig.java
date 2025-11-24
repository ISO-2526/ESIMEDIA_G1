package grupo1.esimedia.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PasswordSecurityConfig {
    
    // Pepper generado aleatoriamente (Base64, 256 bits de entropía)
    @Value("${security.password.pepper:7KmN9pQr3sT6vXz2BnM5yH8jC4fG7kL0eW3xY9qR2tU5wP8aZ1bV6nM4hJ7gF0dS}")
    private String passwordPepper;
    
    @Value("${security.bcrypt.rounds:12}")
    private int bcryptRounds;
    
    @Value("${security.login.max-attempts:5}")
    private int maxLoginAttempts;
    
    @Value("${security.login.lockout-minutes:15}")
    private int lockoutMinutes;
    
    @Value("${security.login.attempt-window-minutes:30}")
    private int attemptWindowMinutes;
    
    public String getPasswordPepper() {
        return passwordPepper;
    }
    
    public int getBcryptRounds() {
        return bcryptRounds;
    }
    
    public int getMaxLoginAttempts() {
        return maxLoginAttempts;
    }
    
    public long getLockoutTimeMs() {
        return lockoutMinutes * 60 * 1000L;
    }
    
    public long getAttemptWindowMs() {
        return attemptWindowMinutes * 60 * 1000L;
    }
}