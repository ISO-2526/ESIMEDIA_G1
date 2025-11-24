package grupo1.esimedia.dto;

import java.util.Map;

/**
 * DTO para devolver estadísticas agregadas de valoraciones de un contenido.
 */
public class RatingStatsDTO {

    private String contentId;
    private Double averageRating;
    private Long totalRatings;
    private Map<Double, Long> distribution; // Distribución de estrellas: {5.0: 50, 4.5: 30, ...}

    // Constructors
    public RatingStatsDTO() {
    }

    public RatingStatsDTO(String contentId, Double averageRating, Long totalRatings) {
        this.contentId = contentId;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
    }

    public RatingStatsDTO(String contentId, Double averageRating, Long totalRatings, 
                         Map<Double, Long> distribution) {
        this.contentId = contentId;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
        this.distribution = distribution;
    }

    // Getters and Setters
    public String getContentId() {
        return contentId;
    }

    public void setContentId(String contentId) {
        this.contentId = contentId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Long totalRatings) {
        this.totalRatings = totalRatings;
    }

    public Map<Double, Long> getDistribution() {
        return distribution;
    }

    public void setDistribution(Map<Double, Long> distribution) {
        this.distribution = distribution;
    }

    @Override
    public String toString() {
        return "RatingStatsDTO{" +
                "contentId=" + contentId +
                ", averageRating=" + averageRating +
                ", totalRatings=" + totalRatings +
                ", distribution=" + distribution +
                '}';
    }
}
