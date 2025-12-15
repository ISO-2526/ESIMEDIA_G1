package grupo1.esimedia.Accounts.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import grupo1.esimedia.security.CookieAuthenticationFilter;
import grupo1.esimedia.security.SessionTimeoutFilter;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private static final String IPANDROIDEMULATOR = "10.0.2.2";
    
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private final SessionTimeoutFilter sessionTimeoutFilter; 
    private final CookieAuthenticationFilter cookieAuthenticationFilter;

    public SecurityConfig(
            SessionTimeoutFilter sessionTimeoutFilter,
            CookieAuthenticationFilter cookieAuthenticationFilter) {
        this.sessionTimeoutFilter = sessionTimeoutFilter;
        this.cookieAuthenticationFilter = cookieAuthenticationFilter;
    }
    
    @Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .authorizeHttpRequests(auth -> auth
            // Endpoints públicos
            .requestMatchers(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/recover",
                "/api/auth/reset-password",
                "/api/auth/validate-reset-token",
                "/api/auth/2fa/setup",
                "/api/auth/send-3fa-code",
                "/api/auth/verify-3fa-code",
                "/api/users",
                "/api/auth/validate-token", 
                "/api/auth/logout"         
            ).permitAll()
            
            .requestMatchers("/health", "/actuator/**").permitAll()
            
            // Todos los demás endpoints requieren autenticación
            .anyRequest().authenticated()
        )
        // ✅ ORDEN IMPORTANTE: CookieAuth ANTES de SessionTimeout
        .addFilterBefore(cookieAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(sessionTimeoutFilter, CookieAuthenticationFilter.class);
    
    return http.build();
}
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ✅ Permitir múltiples orígenes (Web, Ionic, Android)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",      // React Web
            "http://localhost:8100",      // Ionic
            "http://localhost",           // Android/Capacitor
            IPANDROIDEMULATOR,            // Emulador Android
            "capacitor://localhost",      // Capacitor iOS
            "ionic://localhost"           // Ionic iOS
        ));
        
        // ✅ Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", 
            "POST", 
            "PUT", 
            "DELETE", 
            "OPTIONS",
            "PATCH"
        ));
        
        // ✅ Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // ✅ Headers expuestos (para que el cliente pueda leerlos)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Set-Cookie",
            "X-CSRF-Token"
        ));
        
        // ✅ Permitir credenciales (cookies, headers de autorización)
        configuration.setAllowCredentials(true);
        
        // ✅ Tiempo máximo de cache para preflight requests
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}