package grupo1.esimedia.Content.model;

import grupo1.esimedia.Accounts.model.ContentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Document(collection = "contents")
public class Content {

    @Id
    private String id;

    @NotNull
    private ContentType type;

    @NotBlank
    @Size(min = 3, max = 200)
    private String title;

    private String description;

    private List<String> tags;

    @NotNull
    @Min(0)
    private Integer durationMinutes;

    @NotNull
    @Min(0)
    private Integer edadMinima;
    private LocalDate availableUntil;
    private String url;
    private String resolution;
    private String audioFileName;
    private String coverFileName;
    private boolean vipOnly = false;

    @NotNull
    private ContentState state;
    private Instant stateChangedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @NotBlank
    private String creatorAlias;
    
    // Contador de reproducciones
    @Min(0)
    private Long viewCount = 0L;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ContentType getType() {
        return type;
    }

    public void setType(ContentType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Integer getEdadMinima() {
        return edadMinima;
    }

    public void setEdadMinima(Integer edadMinima) {
        this.edadMinima = edadMinima;
    }

    public LocalDate getAvailableUntil() {
        return availableUntil;
    }

    public void setAvailableUntil(LocalDate availableUntil) {
        this.availableUntil = availableUntil;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getAudioFileName() {
        return audioFileName;
    }

    public void setAudioFileName(String audioFileName) {
        this.audioFileName = audioFileName;
    }

    public String getCoverFileName() {
        return coverFileName;
    }

    public void setCoverFileName(String coverFileName) {
        this.coverFileName = coverFileName;
    }

    public boolean isVipOnly() {
        return vipOnly;
    }

    public void setVipOnly(boolean vipOnly) {
        this.vipOnly = vipOnly;
    }

    public ContentState getState() {
        return state;
    }

    public void setState(ContentState state) {
        this.state = state;
    }

    public Instant getStateChangedAt() {
        return stateChangedAt;
    }

    public void setStateChangedAt(Instant stateChangedAt) {
        this.stateChangedAt = stateChangedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatorAlias() {
        return creatorAlias;
    }

    public void setCreatorAlias(String creatorAlias) {
        this.creatorAlias = creatorAlias;
    }

    public Long getViewCount() {
        return viewCount;
    }

    public void setViewCount(Long viewCount) {
        this.viewCount = viewCount;
    }

    /**
     * Incrementa el contador de reproducciones en 1.
     */
    public void incrementViewCount() {
        if (this.viewCount == null) {
            this.viewCount = 0L;
        }
        this.viewCount++;
    }
}