package grupo1.esimedia.content.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class UpdateContentRequestDTO {
    @Size(max = 200, message = "El título no puede superar 200 caracteres")
    private String title;

    @Size(max = 3000, message = "La descripción no puede superar 3000 caracteres")
    private String description;

    private List<String> tags;

    private Boolean vipOnly;

    @Min(value = 1, message = "La duración debe ser mayor a 0")
    @Max(value = 10000, message = "La duración no puede superar 10000 minutos")
    private Integer durationMinutes;

    @Min(value = 0, message = "La edad mínima debe ser 0 o mayor")
    @Max(value = 99, message = "La edad mínima no puede superar 99")
    private Integer edadMinima;

    private String availableUntil;

    private String coverFileName;

    private String state;

    public UpdateContentRequestDTO() {}

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

    public Boolean getVipOnly() {
        return vipOnly;
    }

    public void setVipOnly(Boolean vipOnly) {
        this.vipOnly = vipOnly;
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

    public String getAvailableUntil() {
        return availableUntil;
    }

    public void setAvailableUntil(String availableUntil) {
        this.availableUntil = availableUntil;
    }

    public String getCoverFileName() {
        return coverFileName;
    }

    public void setCoverFileName(String coverFileName) {
        this.coverFileName = coverFileName;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }
}
