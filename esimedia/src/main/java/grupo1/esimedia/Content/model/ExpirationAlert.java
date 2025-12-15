package grupo1.esimedia.Content.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.Instant;

/**
 * Modelo para rastrear alertas de caducidad enviadas (HDU 493 - Task 516)
 * Evita enviar alertas duplicadas (anti-spam)
 */
@Document(collection = "expiration_alerts")
public class ExpirationAlert {
    
    @Id
    private String id;
    
    private String contentId;      // ID del contenido
    private String userId;         // Email del usuario
    private LocalDate alertDate;   // Fecha en que se envió la alerta
    private Instant createdAt;     // Timestamp exacto
    private String alertType;      // "EXPIRING_SOON" o "EXPIRED"
    
    public ExpirationAlert() {
        this.createdAt = Instant.now();
    }
    
    public ExpirationAlert(String contentId, String userId, LocalDate alertDate, String alertType) {
        this.contentId = contentId;
        this.userId = userId;
        this.alertDate = alertDate;
        this.alertType = alertType;
        this.createdAt = Instant.now();
    }
    
    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public LocalDate getAlertDate() { return alertDate; }
    public void setAlertDate(LocalDate alertDate) { this.alertDate = alertDate; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
}
