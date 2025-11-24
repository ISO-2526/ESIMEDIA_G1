package grupo1.esimedia.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InMemorySessionRegistry {

    public static class SessionInfo {
        public final String role;
        public final Instant createdAt;
        public volatile Instant lastActivity;

        public SessionInfo(String role, Instant now) {
            this.role = role;
            this.createdAt = now;
            this.lastActivity = now;
        }
    }
    // Map of session key to SessionInfo
    private final Map<String, SessionInfo> sessions = new ConcurrentHashMap<>();

    @Value("${security.session.user.idle-minutes:20}")
    private long userIdleMinutes;
    @Value("${security.session.user.absolute-hours:8}")
    private long userAbsoluteHours;

    @Value("${security.session.admin.idle-minutes:15}")
    private long adminIdleMinutes;
    @Value("${security.session.admin.absolute-hours:7}")
    private long adminAbsoluteHours;

    @Value("${security.session.creator.idle-minutes:15}")
    private long creatorIdleMinutes;
    @Value("${security.session.creator.absolute-hours:7}")
    private long creatorAbsoluteHours;

    public SessionInfo getOrCreate(String key, String role) {
        return sessions.computeIfAbsent(key, k -> new SessionInfo(normalizeRole(role), Instant.now()));
    }

    public void touch(SessionInfo s) {
        s.lastActivity = Instant.now();
    }

    public boolean isIdleExpired(SessionInfo s) {
        Duration idle = getIdle(s.role);
        return Duration.between(s.lastActivity, Instant.now()).compareTo(idle) > 0;
    }

    public boolean isAbsoluteExpired(SessionInfo s) {
        Duration abs = getAbsolute(s.role);
        return Duration.between(s.createdAt, Instant.now()).compareTo(abs) > 0;
    }

    private Duration getIdle(String role) {
        switch (normalizeRole(role)) {
            case "admin":   return Duration.ofMinutes(adminIdleMinutes);
            case "creator": return Duration.ofMinutes(creatorIdleMinutes);
            default:        return Duration.ofMinutes(userIdleMinutes);
        }
    }

    private Duration getAbsolute(String role) {
        switch (normalizeRole(role)) {
            case "admin":   return Duration.ofHours(adminAbsoluteHours);
            case "creator": return Duration.ofHours(creatorAbsoluteHours);
            default:        return Duration.ofHours(userAbsoluteHours);
        }
    }

    private String normalizeRole(String role) {
        return role == null ? "user" : role.trim().toLowerCase();
    }

    public void remove(String key) {
        sessions.remove(key);
    }
}