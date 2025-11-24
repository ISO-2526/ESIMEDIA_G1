package grupo1.esimedia.security;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class LoginAttempt {
    private int attempts;
    private Instant firstAttempt;
    private Instant lockedUntil;
    private List<String> ipAddresses;
    
    public LoginAttempt() {
        this.attempts = 0;
        this.firstAttempt = Instant.now();
        this.lockedUntil = null;
        this.ipAddresses = new ArrayList<>();
    }
    
    public int getAttempts() {
        return attempts;
    }
    
    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }
    
    public void incrementAttempts() {
        this.attempts++;
    }
    
    public Instant getFirstAttempt() {
        return firstAttempt;
    }
    
    public void setFirstAttempt(Instant firstAttempt) {
        this.firstAttempt = firstAttempt;
    }
    
    public Instant getLockedUntil() {
        return lockedUntil;
    }
    
    public void setLockedUntil(Instant lockedUntil) {
        this.lockedUntil = lockedUntil;
    }
    
    public List<String> getIpAddresses() {
        return ipAddresses;
    }
    
    public void addIpAddress(String ip) {
        if (ip != null && !this.ipAddresses.contains(ip)) {
            this.ipAddresses.add(ip);
        }
    }
    
    public boolean isLocked() {
        return lockedUntil != null && Instant.now().isBefore(lockedUntil);
    }
    
    public long getRemainingLockoutSeconds() {
        if (lockedUntil == null || !isLocked()) {
            return 0;
        }
        return Instant.now().until(lockedUntil, java.time.temporal.ChronoUnit.SECONDS);
    }
}