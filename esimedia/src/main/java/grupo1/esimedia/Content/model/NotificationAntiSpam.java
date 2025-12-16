package grupo1.esimedia.content.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Sistema anti-spam para evitar envío duplicado de notificaciones.
 * Registra qué usuarios ya han sido notificados sobre un contenido específico.
 * Sirve tanto para alertas de caducidad como para notificaciones de publicación.
 */
@Document(collection = "notification_antispam")
@CompoundIndex(name = "unique_notification", def = "{'contentId': 1, 'userId': 1, 'notificationType': 1}", unique = true)
public class NotificationAntiSpam {
    
    @Id
    private String id;
    
    private String contentId;         // ID del contenido
    private String userId;            // Email del usuario
    private Instant sentAt;           // Timestamp cuando se envió
    private String notificationType;  // "CONTENT_PUBLISHED", "CONTENT_EXPIRING"
    
    public NotificationAntiSpam() {
        this.sentAt = Instant.now();
    }
    
    public NotificationAntiSpam(String contentId, String userId, String notificationType) {
        this.contentId = contentId;
        this.userId = userId;
        this.notificationType = notificationType;
        this.sentAt = Instant.now();
    }
    
    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
}
