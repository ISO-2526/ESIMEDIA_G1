package grupo1.esimedia.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SessionTimeoutFilter extends OncePerRequestFilter {

    private final InMemorySessionRegistry registry;

    public SessionTimeoutFilter(InMemorySessionRegistry registry) {
        this.registry = registry;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // No filtrar recursos públicos/estáticos
        return path.startsWith("/api/public")
                || path.startsWith("/cover/")
                || path.startsWith("/pfp/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String sessionKey = resolveSessionKey(req);
        String role = resolveRole(req);

        if (sessionKey == null) {
            chain.doFilter(req, res);
            return;
        }

        InMemorySessionRegistry.SessionInfo s = registry.getOrCreate(sessionKey, role);

        // Validar absolute/idle
        if (registry.isAbsoluteExpired(s)) {
            registry.remove(sessionKey);
            writeExpired(res, "absolute");
            return;
        }
        if (registry.isIdleExpired(s)) {
            registry.remove(sessionKey);
            writeExpired(res, "idle");
            return;
        }

        registry.touch(s);
        chain.doFilter(req, res);
    }

    private String resolveSessionKey(HttpServletRequest req) {
        // 1) Bearer token
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) return auth.substring(7).trim();

        // 2) Sesión dev
        String sid = req.getHeader("X-Session-Id");
        if (sid != null && !sid.isBlank()) return sid;

        // 3) Fallback dev por email
        String email = req.getHeader("X-User-Email");
        if (email != null && !email.isBlank()) return "DEV:" + email;

        return null;
    }

    private String resolveRole(HttpServletRequest req) {
        String role = resolveRoleFromAuthentication();
        if (role != null) return role;

        String hdr = req.getHeader("X-User-Role");
        if (hdr != null && !hdr.isBlank()) return hdr.toLowerCase();

        return "user";
    }

    private String resolveRoleFromAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Collection<?> authorities = auth.getAuthorities();
        if (authorities == null) return null;

        return authorities.stream()
                .map(Object::toString)
                .map(String::toLowerCase)
                .map(this::mapAuthorityToRole)
                .filter(r -> r != null)
                .findFirst()
                .orElse(null);
    }

    private String mapAuthorityToRole(String authorityLower) {
        if (authorityLower.contains("admin")) return "admin";
        if (authorityLower.contains("creator")) return "creator";
        if (authorityLower.contains("user")) return "user";
        return null;
    }

    private void writeExpired(HttpServletResponse res, String kind) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.setHeader("X-Session-Expired", kind);
        String body = "{\"error\":\"session_expired\",\"reason\":\"" + kind + "\"}";
        res.getWriter().write(body);
    }
}