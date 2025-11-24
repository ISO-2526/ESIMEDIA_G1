package grupo1.esimedia.utils;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import grupo1.esimedia.config.PasswordSecurityConfig;

@Component
public class PasswordUtils {
    
    private static final Logger log = LoggerFactory.getLogger(PasswordUtils.class);
    
    @Autowired
    private PasswordSecurityConfig securityConfig;
    
    @Autowired
    private HaveIBeenPwnedService hibpService; // ✅ NUEVO: 847M+ contraseñas comprometidas
    
    @Value("${app.environment:production}")
    private String environment;
    
    @Value("${security.password.check-hibp:true}")
    private boolean checkHibp;
    
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    private boolean isDebugMode() {
        return "development".equalsIgnoreCase(environment) || "dev".equalsIgnoreCase(environment);
    }

    /**
     * ✅ Validar que la contraseña no contenga información personal
     * @return Lista de errores (vacía si es válida)
     */
    public List<String> validatePasswordPersonalInfo(String password, String email, String name, String surname, String alias) {
        List<String> errors = new ArrayList<>();
        
        if (password == null || password.isEmpty()) {
            errors.add("La contraseña no puede estar vacía");
            return errors;
        }
        
        String passwordLower = password.toLowerCase();
        
        // ✅ PASO 2: Validar contra Have I Been Pwned (847M+ contraseñas comprometidas)
        if (checkHibp && hibpService.isPasswordPwned(password)) {
            errors.add("Esta contraseña ha sido comprometida en filtraciones de datos. Por seguridad, elige otra.");
            return errors;
        }
        
        // PASO 3: Validar información personal
        addIfContains(errors, passwordLower, getEmailPrefixLower(email), "La contraseña no puede contener tu email");
        addIfContains(errors, passwordLower, name, "La contraseña no puede contener tu nombre");
        addIfContains(errors, passwordLower, surname, "La contraseña no puede contener tu apellido");
        addIfContains(errors, passwordLower, alias, "La contraseña no puede contener tu alias");
        
        return errors;
    }

    // Helpers para reducir la complejidad cognitiva (sin cambiar funcionalidad)
    private void addIfContains(List<String> errors, String passwordLower, String candidate, String message) {
        if (containsIdentifier(passwordLower, candidate, 3)) {
            errors.add(message);
        }
    }

    private boolean containsIdentifier(String passwordLower, String candidate, int minLength) {
        if (candidate == null) return false;
        String candidateLower = candidate.toLowerCase();
        return candidateLower.length() >= minLength && passwordLower.contains(candidateLower);
    }

    private String getEmailPrefixLower(String email) {
        if (email == null || email.isEmpty()) return null;
        String[] parts = email.split("@", 2);
        String prefix = parts.length > 0 ? parts[0] : null;
        return (prefix == null || prefix.isEmpty()) ? null : prefix.toLowerCase();
    }
    
    /**
     * Pre-hashea la contraseña + pepper con SHA-256 para evitar límite de 72 bytes de bcrypt
     */
    private String preHashPassword(String plainPassword) {
        try {
            String passwordWithPepper = plainPassword + securityConfig.getPasswordPepper();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(passwordWithPepper.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Error al pre-hashear contraseña", e);
            throw new RuntimeException("Error al procesar la contraseña", e);
        }
    }
    
    /**
     * Hash de contraseña con SHA-256 + bcrypt + pepper
     */
    public String hashPassword(String plainPassword) {
        try {
            if (isDebugMode()) {
                log.info("═══════════════════════════════════════════════════════");
                log.info("🔐 GENERACIÓN DE HASH DE CONTRASEÑA");
                log.info("═══════════════════════════════════════════════════════");
                log.info("📝 Contraseña original: '{}'", plainPassword);
                log.info("📏 Longitud: {} caracteres", plainPassword.length());
            }
            
            // Pre-hash con SHA-256 + pepper
            String preHashed = preHashPassword(plainPassword);
            
            if (isDebugMode()) {
                log.info("🌶️  Pre-hash SHA-256 + Pepper: {}", preHashed);
                log.info("📏 Longitud pre-hash: {} bytes", preHashed.getBytes("UTF-8").length);
            }
            
            // Aplicar bcrypt al pre-hash
            String finalHash = encoder.encode(preHashed);
            
            if (isDebugMode()) {
                log.info("🔐 Hash final (bcrypt): {}", finalHash);
                log.info("═══════════════════════════════════════════════════════\n");
            }
            
            return finalHash;
        } catch (Exception e) {
            log.error("Error al hashear contraseña", e);
            throw new RuntimeException("Error al procesar la contraseña", e);
        }
    }
    
    /**
     * Verificar contraseña con SHA-256 + bcrypt + pepper
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        try {
            if (isDebugMode()) {
                log.info("═══════════════════════════════════════════════════════");
                log.info("🔍 VERIFICACIÓN DETALLADA DE CONTRASEÑA");
                log.info("═══════════════════════════════════════════════════════");
                log.info("📥 INPUT DEL USUARIO:");
                log.info("   Contraseña ingresada: '{}'", plainPassword);
                log.info("   Longitud: {} caracteres", plainPassword.length());
                log.info("");
                log.info("💾 HASH ALMACENADO EN BD:");
                log.info("   {}", hashedPassword);
                log.info("   Longitud: {} caracteres", hashedPassword.length());
            }
            
            // Pre-hash con SHA-256 + pepper
            String preHashed = preHashPassword(plainPassword);
            
            if (isDebugMode()) {
                log.info("");
                log.info("🧪 VERIFICACIÓN:");
                log.info("   Pre-hash generado: {}", preHashed);
                log.info("   Longitud: {} bytes", preHashed.getBytes("UTF-8").length);
            }
            
            // Verificar con bcrypt
            boolean match = encoder.matches(preHashed, hashedPassword);
            
            if (isDebugMode()) {
                log.info("   Resultado: {} {}", match ? "✅ MATCH" : "❌ NO MATCH",
                         match ? "(Contraseña correcta)" : "(Contraseña incorrecta)");
                log.info("");
                log.info("═══════════════════════════════════════════════════════");
                
                if (match) {
                    log.info("✅ ✅ ✅ CONTRASEÑA CORRECTA - LOGIN PERMITIDO ✅ ✅ ✅");
                } else {
                    log.error("❌ ❌ ❌ CONTRASEÑA INCORRECTA - LOGIN DENEGADO ❌ ❌ ❌");
                    log.error("   Posibles causas:");
                    log.error("   1. Contraseña incorrecta");
                    log.error("   2. Pepper incorrecto en la configuración");
                    log.error("   3. Hash corrupto en la base de datos");
                }
                
                log.info("═══════════════════════════════════════════════════════\n");
            }
            
            return match;
        } catch (Exception e) {
            log.error("Error al verificar contraseña", e);
            return false;
        }
    }
    
    /**
     * Método auxiliar para debugging: comparar dos hashes
     */
    public void compareHashes(String password, String hash1, String hash2) {
        if (!isDebugMode()) return;
        
        log.info("═══════════════════════════════════════════════════════");
        log.info("🔬 COMPARACIÓN DE HASHES");
        log.info("═══════════════════════════════════════════════════════");
        log.info("Contraseña: '{}'", password);
        log.info("");
        log.info("Hash 1: {}", hash1);
        log.info("Hash 2: {}", hash2);
        log.info("");
        log.info("Son iguales: {}", hash1.equals(hash2));
        log.info("");
        
        String preHashed = preHashPassword(password);
        
        log.info("Verificación Hash 1:");
        log.info("  Con pre-hash: {}", encoder.matches(preHashed, hash1));
        log.info("");
        log.info("Verificación Hash 2:");
        log.info("  Con pre-hash: {}", encoder.matches(preHashed, hash2));
        log.info("═══════════════════════════════════════════════════════\n");
    }
}