package grupo1.esimedia.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad MongoDB que representa una valoración de un contenido por parte de un usuario.
 * Permite almacenar ratings de 0.5 a 5.0 estrellas con incrementos de 0.5.
 */
@Document(collection = "ratings")
@CompoundIndex(name = "user_content_idx", def = "{'userId': 1, 'contentId': 1}", unique = true)
public class Rating {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String contentId; // String porque MongoDB usa ObjectId

    @Indexed
    private Double rating; // Valores permitidos: 0.5, 1.0, 1.5, 2.0, ..., 5.0

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Rating() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Rating(String userId, String contentId, Double rating) {
        this();
        this.userId = userId;
        this.contentId = contentId;
        setRating(rating);
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

    public String getContentId() {
        return contentId;
    }

    public void setContentId(String contentId) {
        this.contentId = contentId;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        // Validar que el rating esté en el rango permitido
        if (rating == null || rating < 0.5 || rating > 5.0) {
            throw new IllegalArgumentException("El rating debe estar entre 0.5 y 5.0");
        }
        // Validar que sea múltiplo de 0.5
        double multiplied = rating * 10;
        if (Math.abs(multiplied - Math.round(multiplied)) > 0.001 || ((int)multiplied % 5 != 0)) {
            throw new IllegalArgumentException("El rating debe ser múltiplo de 0.5");
        }
        this.rating = rating;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Rating rating = (Rating) o;
        return Objects.equals(id, rating.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Rating{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", contentId=" + contentId +
                ", rating=" + rating +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
