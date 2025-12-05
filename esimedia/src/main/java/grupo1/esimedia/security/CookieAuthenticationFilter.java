package grupo1.esimedia.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CookieAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CookieAuthenticationFilter.class);
    private final TokenRepository tokenRepository;

    public CookieAuthenticationFilter(TokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // No filtrar endpoints públicos
        return path.startsWith("/api/auth/login") 
            || path.startsWith("/api/auth/register")
            || path.startsWith("/api/auth/recover")
            || path.startsWith("/api/auth/reset-password")
            || path.startsWith("/api/auth/validate-reset-token")
            || path.startsWith("/api/auth/2fa/setup")
            || path.startsWith("/api/auth/send-3fa-code")
            || path.startsWith("/api/auth/verify-3fa-code")
            || path.startsWith("/api/public")
            || path.startsWith("/health")
            || path.startsWith("/actuator")
            || path.startsWith("/cover/")
            || path.startsWith("/pfp/")
            || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        log.debug("🔐 CookieAuthenticationFilter - Processing: {}", path);

        // ⚠️ HYBRID STRATEGY: Prioridad 1 - Header Authorization (Móvil), Prioridad 2 - Cookie (Web)
        String tokenId = null;
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            tokenId = authHeader.substring(7);
            log.debug("🔑 Token extracted from Authorization header (mobile): {}", tokenId);
        } else {
            tokenId = extractTokenFromCookie(request);
            if (tokenId != null) {
                log.debug("🔑 Token extracted from cookie (web): {}", tokenId);
            }
        }
        
        if (tokenId == null || tokenId.isBlank()) {
            log.debug("❌ No token found in Authorization header or cookies for path: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Validar token en la base de datos
        Token token = tokenRepository.findById(tokenId).orElse(null);
        
        if (token == null) {
            log.warn("⚠️ Token not found in database: {}", tokenId);
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Verificar que no esté expirado
        if (token.getExpiration() == null || token.getExpiration().isBefore(LocalDateTime.now())) {
            log.warn("⚠️ Token expired: {} - Expiration: {}", tokenId, token.getExpiration());
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Crear Authentication y establecerlo en el SecurityContext
        String role = token.getRole(); // "admin", "creator", "user"
        String email = token.getAccountId();

        log.info("✅ Valid token - Email: {} | Role: {} | Path: {}", email, role, path);

        // Crear authority con prefijo ROLE_ (requerido por Spring Security)
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

        // Crear Authentication
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(
                email, // principal
                null, // credentials (no necesarias aquí)
                Collections.singletonList(authority) // authorities
            );

        // Establecer en el contexto de seguridad
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("🔓 Authentication set - Principal: {} | Authorities: {}", email, authority);

        // Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if ("access_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}