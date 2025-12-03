package grupo1.esimedia.Accounts.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId; // Email of the user receiving the notification
    private String message;
    private boolean read = false;
    private LocalDateTime createdAt;
    private String relatedContentId; // ID of the content that triggered the notification

    public Notification() {
        this.createdAt = LocalDateTime.now();
    }

    public Notification(String userId, String message, String relatedContentId) {
        this.userId = userId;
        this.message = message;
        this.relatedContentId = relatedContentId;
        this.createdAt = LocalDateTime.now();
        this.read = false;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRelatedContentId() {
        return relatedContentId;
    }

    public void setRelatedContentId(String relatedContentId) {
        this.relatedContentId = relatedContentId;
    }
}
