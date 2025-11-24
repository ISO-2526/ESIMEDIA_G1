package grupo1.esimedia.utils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service; // <-- añadido

@Service
public class HaveIBeenPwnedService {
    
    private static final Logger log = LoggerFactory.getLogger(HaveIBeenPwnedService.class);
    private static final String HIBP_API_URL = "https://api.pwnedpasswords.com/range/";
    
    private final HttpClient httpClient;
    
    public HaveIBeenPwnedService() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    }
    
    /**
     * 🔒 Verifica si una contraseña ha sido comprometida en filtraciones de datos
     * Usa k-Anonymity: solo envía los primeros 5 caracteres del hash SHA-1
     * 
     * @param password Contraseña a verificar
     * @return true si la contraseña está comprometida (aparece en filtraciones)
     */
    public boolean isPasswordPwned(String password) {
        try {
            // 1. Generar hash SHA-1 de la contraseña
            String sha1Hash = generateSHA1(password);
            
            if (sha1Hash == null) {
                log.warn("⚠️ No se pudo generar hash SHA-1, permitiendo contraseña por seguridad");
                return false; // Fail-open: permitir en caso de error
            }
            
            // 2. Dividir en prefix (primeros 5) y suffix (resto)
            String prefix = sha1Hash.substring(0, 5).toUpperCase();
            String suffix = sha1Hash.substring(5).toUpperCase();
            
            log.debug("🔍 Verificando contraseña en HIBP (prefix: {})", prefix);
            
            // 3. Consultar API con el prefix (k-Anonymity)
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(HIBP_API_URL + prefix))
                .header("User-Agent", "ESIMEDIA-Password-Validator/1.0")
                .header("Add-Padding", "true") // Mejora privacidad
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // 4. Buscar el suffix en la respuesta
                String[] hashes = response.body().split("\n");
                for (String line : hashes) {
                    String[] parts = line.split(":");
                    if (parts.length == 2 && parts[0].equalsIgnoreCase(suffix)) {
                        int count = Integer.parseInt(parts[1].trim());
                        log.warn("🚨 Contraseña COMPROMETIDA: aparece {} veces en filtraciones", count);
                        return true;
                    }
                }
                
                log.info("✅ Contraseña NO encontrada en filtraciones (HIBP)");
                return false;
                
            } else if (response.statusCode() == 429) {
                log.warn("⚠️ Rate limit alcanzado en HIBP API, permitiendo contraseña");
                return false; // Fail-open
                
            } else {
                log.error("❌ Error al consultar HIBP API: HTTP {}", response.statusCode());
                return false; // Fail-open
            }
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("❌ Thread interrumpido al verificar contraseña en HIBP", e);
            return false; // Fail-open
            
        } catch (Exception e) {
            log.error("❌ Error al verificar contraseña en HIBP: {}", e.getMessage());
            return false; // Fail-open: permitir en caso de error de red
        }
    }
    
    /**
     * Genera hash SHA-1 de la contraseña EXCLUSIVAMENTE para la API k-Anonymity de HIBP.
     * No se usa para almacenar ni verificar contraseñas.
     * Justificación: la especificación de HIBP exige SHA-1.
     * Ver: https://haveibeenpwned.com/API/v3#PwnedPasswords
     */
    @SuppressWarnings({"java:S2070", "java:S4790"}) // Uso intencional de SHA-1 solo para HIBP (no sensible)
    private String generateSHA1(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8)); // sin cambios funcionales
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error al generar SHA-1", e);
            return null;
        }
    }
    
    /**
     * Obtiene estadísticas del servicio
     */
    public String getStats() {
        return "Have I Been Pwned API - 847+ millones de contraseñas comprometidas";
    }
}