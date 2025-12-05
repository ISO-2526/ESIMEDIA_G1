package grupo1.esimedia.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad MongoDB que representa una notificación para un usuario.
 * Permite almacenar notificaciones con tipos, mensajes y estado de lectura.
 */
@Document(collection = "user_notifications")
public class UserNotification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String message;

    /**
     * Tipos de notificaciones posibles:
     * - INFO: Información general
     * - WARNING: Advertencia
     * - ERROR: Error
     * - SUCCESS: Operación exitosa
     */
    private String type; // INFO, WARNING, ERROR, SUCCESS

    @Indexed
    private Boolean read; // Si la notificación ha sido leída

    private LocalDateTime createdAt;

    private LocalDateTime readAt; // Fecha cuando se marcó como leída

    // Constructors
    public UserNotification() {
        this.createdAt = LocalDateTime.now();
        this.read = false;
    }

    public UserNotification(String userId, String title, String message, String type) {
        this();
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type != null ? type : "INFO";
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
        if (read && this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserNotification that = (UserNotification) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "UserNotification{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", title='" + title + '\'' +
                ", message='" + message + '\'' +
                ", type='" + type + '\'' +
                ", read=" + read +
                ", createdAt=" + createdAt +
                ", readAt=" + readAt +
                '}';
    }
}
