package grupo1.esimedia.dto;

import jakarta.validation.constraints.*;

/**
 * DTO para recibir una nueva valoración o actualizar una existente.
 */
public class RatingRequestDTO {

    @NotNull(message = "El ID del contenido es obligatorio")
    private String contentId;

    @NotNull(message = "La valoración es obligatoria")
    @DecimalMin(value = "0.5", message = "La valoración mínima es 0.5")
    @DecimalMax(value = "5.0", message = "La valoración máxima es 5.0")
    private Double rating;

    // Constructors
    public RatingRequestDTO() {
    }

    public RatingRequestDTO(String contentId, Double rating) {
        this.contentId = contentId;
        this.rating = rating;
    }

    // Getters and Setters
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
        // Validar que sea múltiplo de 0.5
        if (rating != null && (rating * 10) % 5 != 0) {
            throw new IllegalArgumentException("El rating debe ser múltiplo de 0.5");
        }
        this.rating = rating;
    }

    @Override
    public String toString() {
        return "RatingRequestDTO{" +
                "contentId=" + contentId +
                ", rating=" + rating +
                '}';
    }
}
