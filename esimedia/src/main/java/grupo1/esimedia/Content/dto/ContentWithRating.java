package grupo1.esimedia.Content.dto;

import grupo1.esimedia.Accounts.model.ContentType;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO que representa un Content con su valoración promedio calculada dinámicamente.
 * Este DTO expone todos los campos de Content más el campo ratingStars calculado
 * desde la tabla ratings, sin duplicar información en la base de datos.
 */
public class ContentWithRating {
    private String id;
    private ContentType type;
    private String title;
    private String description;
    private List<String> tags;
    private Integer durationMinutes;
    private Integer edadMinima;
    private LocalDate availableUntil;
    private String url;
    private String resolution;
    private String audioFileName;
    private String coverFileName;
    private boolean vipOnly;
    private ContentState state;
    private Instant stateChangedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String creatorAlias;
    private Long viewCount;
    
    // Campo calculado dinámicamente desde la tabla ratings
    private double ratingStars;

    /**
     * Constructor que crea un ContentWithRating a partir de un Content y su rating calculado
     */
    public ContentWithRating(Content content, double ratingStars) {
        this.id = content.getId();
        this.type = content.getType();
        this.title = content.getTitle();
        this.description = content.getDescription();
        this.tags = content.getTags();
        this.durationMinutes = content.getDurationMinutes();
        this.edadMinima = content.getEdadMinima();
        this.availableUntil = content.getAvailableUntil();
        this.url = content.getUrl();
        this.resolution = content.getResolution();
        this.audioFileName = content.getAudioFileName();
        this.coverFileName = content.getCoverFileName();
        this.vipOnly = content.isVipOnly();
        this.state = content.getState();
        this.stateChangedAt = content.getStateChangedAt();
        this.createdAt = content.getCreatedAt();
        this.updatedAt = content.getUpdatedAt();
        this.creatorAlias = content.getCreatorAlias();
        this.viewCount = content.getViewCount();
        this.ratingStars = ratingStars;
    }

    // Getters
    public String getId() { return id; }
    public ContentType getType() { return type; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public List<String> getTags() { return tags; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public Integer getEdadMinima() { return edadMinima; }
    public LocalDate getAvailableUntil() { return availableUntil; }
    public String getUrl() { return url; }
    public String getResolution() { return resolution; }
    public String getAudioFileName() { return audioFileName; }
    public String getCoverFileName() { return coverFileName; }
    public boolean isVipOnly() { return vipOnly; }
    public ContentState getState() { return state; }
    public Instant getStateChangedAt() { return stateChangedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getCreatorAlias() { return creatorAlias; }
    public Long getViewCount() { return viewCount; }
    public double getRatingStars() { return ratingStars; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setType(ContentType type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public void setEdadMinima(Integer edadMinima) { this.edadMinima = edadMinima; }
    public void setAvailableUntil(LocalDate availableUntil) { this.availableUntil = availableUntil; }
    public void setUrl(String url) { this.url = url; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public void setAudioFileName(String audioFileName) { this.audioFileName = audioFileName; }
    public void setCoverFileName(String coverFileName) { this.coverFileName = coverFileName; }
    public void setVipOnly(boolean vipOnly) { this.vipOnly = vipOnly; }
    public void setState(ContentState state) { this.state = state; }
    public void setStateChangedAt(Instant stateChangedAt) { this.stateChangedAt = stateChangedAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setCreatorAlias(String creatorAlias) { this.creatorAlias = creatorAlias; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }
    public void setRatingStars(double ratingStars) { this.ratingStars = ratingStars; }
}
