package grupo1.esimedia.Accounts.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

/**
 * Modelo de Notificación para HDU 492.
 * Se crea cuando se publica contenido que coincide con las preferencias (tags) del usuario.
 */
@Document(collection = "notifications")
public class Notification {
    
    @Id
    private String id;
    
    private String userId;           // Email del usuario destinatario
    private String contentId;        // ID del contenido que disparó la notificación
    private String contentTitle;     // Título del contenido
    private String creatorAlias;     // Alias del creador del contenido
    private String message;          // Mensaje de la notificación
    private boolean read;            // ¿Leída?
    private Instant createdAt;       // Fecha de creación
    private List<String> matchingTags; // Tags que coincidieron con las preferencias del usuario

    public Notification() {
        this.read = false;
        this.createdAt = Instant.now();
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    
    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }
    
    public String getCreatorAlias() { return creatorAlias; }
    public void setCreatorAlias(String creatorAlias) { this.creatorAlias = creatorAlias; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public List<String> getMatchingTags() { return matchingTags; }
    public void setMatchingTags(List<String> matchingTags) { this.matchingTags = matchingTags; }
}
