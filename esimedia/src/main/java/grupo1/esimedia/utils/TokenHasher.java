// Archivo: TokenHasher.java
package grupo1.esimedia.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import org.slf4j.Logger;


/**
 * Utilidad para hashear tokens de un solo uso (ej. reseteo, confirmación).
 * Usa SHA-256 por ser rápido y seguro para este propósito.
 * * NO USAR para contraseñas (para eso se usa Bcrypt/Argon2).
 */
public class TokenHasher {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(TokenHasher.class);

    /**
     * Hashea un token en texto plano usando SHA-256 y lo codifica en Base64.
     * * @param plainTextToken El token en texto plano (ej. el UUID)
     * @return El string del hash en Base64, listo para guardar en BD
     */
    public static String hashToken(String plainTextToken) {
        if (plainTextToken == null || plainTextToken.isBlank()) {
            // Manejar el caso de un token nulo o vacío
            return null;
        }
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                plainTextToken.getBytes(StandardCharsets.UTF_8));
            
            // Usamos Base64 (URL-safe) para tener un string legible para guardar en Mongo
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 es un algoritmo estándar de Java, esto nunca debería ocurrir.
            logger.error("Algoritmo SHA-256 no encontrado. ¡Esto es crítico!", e);
            throw new RuntimeException("Error interno del servidor al hashear token", e);
        }
    }
}