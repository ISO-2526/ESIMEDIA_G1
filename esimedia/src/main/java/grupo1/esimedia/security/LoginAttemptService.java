package grupo1.esimedia.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import grupo1.esimedia.config.PasswordSecurityConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {
    
    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);
    
    @Autowired
    private PasswordSecurityConfig securityConfig;
    
    // Almacenamiento en memoria: Clave = "email:ip"
    private final Map<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();
    
    // Contador global por email (para detectar ataques distribuidos)
    private final Map<String, Integer> globalEmailAttempts = new ConcurrentHashMap<>();
    
    /**
     * Genera clave única: email + IP
     */
    private String getKey(String email, String ipAddress) {
        return email + ":" + ipAddress;
    }
    
    /**
     * Registrar intento fallido de login
     */
    public void recordFailedAttempt(String email, String ipAddress) {
        Instant now = Instant.now();
        String key = getKey(email, ipAddress);
        
        // Incrementar contador global de email
        globalEmailAttempts.merge(email, 1, Integer::sum);
        
        LoginAttempt attempt = loginAttempts.computeIfAbsent(key, k -> new LoginAttempt());
        
        // Resetear si pasó la ventana de tiempo
        long windowMs = securityConfig.getAttemptWindowMs();
        if (now.toEpochMilli() - attempt.getFirstAttempt().toEpochMilli() > windowMs) {
            attempt.setAttempts(1);
            attempt.setFirstAttempt(now);
            attempt.setLockedUntil(null);
            attempt.getIpAddresses().clear();
            attempt.addIpAddress(ipAddress);
        } else {
            // Incrementar intentos
            attempt.incrementAttempts();
            attempt.addIpAddress(ipAddress);
            
            // Bloquear si excede el máximo
            if (attempt.getAttempts() >= securityConfig.getMaxLoginAttempts()) {
                Instant lockUntil = now.plusMillis(securityConfig.getLockoutTimeMs());
                attempt.setLockedUntil(lockUntil);
                
                // ⚠️ ALERTA DE SEGURIDAD
                log.warn("⚠️ ALERTA DE SEGURIDAD: Cuenta bloqueada por múltiples intentos fallidos\n" +
                        "  - Usuario/Email: {}\n" +
                        "  - IP: {}\n" +
                        "  - Intentos desde esta IP: {}\n" +
                        "  - Intentos globales del email: {}\n" +
                        "  - Bloqueado hasta: {}",
                        email,
                        ipAddress,
                        attempt.getAttempts(),
                        globalEmailAttempts.getOrDefault(email, 0),
                        lockUntil);
                
                // Detectar ataque distribuido
                int totalAttempts = globalEmailAttempts.getOrDefault(email, 0);
                if (totalAttempts > securityConfig.getMaxLoginAttempts() * 3) {
                    log.error("🚨 ATAQUE DISTRIBUIDO DETECTADO: Email '{}' tiene {} intentos desde múltiples IPs", 
                             email, totalAttempts);
                }
            }
        }
        
        loginAttempts.put(key, attempt);
    }
    
    /**
     * Verificar si está bloqueado (por email + IP)
     */
    public boolean isLocked(String email, String ipAddress) {
        String key = getKey(email, ipAddress);
        LoginAttempt attempt = loginAttempts.get(key);
        
        if (attempt == null) {
            return false;
        }
        
        // Si el bloqueo expiró, limpiar
        if (attempt.getLockedUntil() != null && !attempt.isLocked()) {
            loginAttempts.remove(key);
            return false;
        }
        
        return attempt.isLocked();
    }
    
    /**
     * Obtener intentos restantes (por email + IP)
     */
    public int getRemainingAttempts(String email, String ipAddress) {
        String key = getKey(email, ipAddress);
        LoginAttempt attempt = loginAttempts.get(key);
        
        if (attempt == null) {
            return securityConfig.getMaxLoginAttempts();
        }
        
        return Math.max(0, securityConfig.getMaxLoginAttempts() - attempt.getAttempts());
    }
    
    /**
     * Resetear intentos (después de login exitoso)
     */
    public void resetAttempts(String email, String ipAddress) {
        String key = getKey(email, ipAddress);
        loginAttempts.remove(key);
        
        // Resetear también el contador global si no hay más intentos de otras IPs
        boolean hasOtherAttempts = loginAttempts.keySet().stream()
            .anyMatch(k -> k.startsWith(email + ":"));
        
        if (!hasOtherAttempts) {
            globalEmailAttempts.remove(email);
        }
        
        log.info("✓ Login exitoso - Intentos reseteados para: {} desde IP: {}", email, ipAddress);
    }
    
    /**
     * Obtener tiempo de bloqueo restante en segundos
     */
    public long getLockoutTime(String email, String ipAddress) {
        String key = getKey(email, ipAddress);
        LoginAttempt attempt = loginAttempts.get(key);
        
        if (attempt == null || !attempt.isLocked()) {
            return 0;
        }
        
        return attempt.getRemainingLockoutSeconds();
    }
    
    /**
     * Obtener información de intentos (para debugging/monitoreo)
     */
    public LoginAttempt getAttemptInfo(String email, String ipAddress) {
        String key = getKey(email, ipAddress);
        return loginAttempts.get(key);
    }
    
    /**
     * Obtener total de intentos globales por email (todas las IPs)
     */
    public int getGlobalAttemptsForEmail(String email) {
        return globalEmailAttempts.getOrDefault(email, 0);
    }
    
    /**
     * Verificar si hay ataque distribuido (múltiples IPs atacando el mismo email)
     */
    public boolean isDistributedAttack(String email) {
        int totalAttempts = globalEmailAttempts.getOrDefault(email, 0);
        return totalAttempts > securityConfig.getMaxLoginAttempts() * 3;
    }
}