package com.esimedia.content.dto;

import jakarta.validation.constraints.*;
import java.util.List;

import com.esimedia.accounts.model.ContentType;

public class CreateContentRequestDTO {
    @NotNull(message = "El tipo de contenido es obligatorio")
    private ContentType type;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200, message = "El título no puede superar 200 caracteres")
    private String title;

    @Size(max = 3000, message = "La descripción no puede superar 3000 caracteres")
    private String description;

    @NotNull(message = "Las etiquetas son obligatorias")
    @Size(min = 1, message = "Debe seleccionar al menos una etiqueta")
    private List<String> tags;

    private Boolean vipOnly;

    @NotNull(message = "La duración es obligatoria")
    @Min(value = 1, message = "La duración debe ser mayor a 0")
    @Max(value = 10000, message = "La duración no puede superar 10000 minutos")
    private Integer durationMinutes;

    @NotNull(message = "La edad mínima es obligatoria")
    @Min(value = 0, message = "La edad mínima debe ser 0 o mayor")
    @Max(value = 99, message = "La edad mínima no puede superar 99")
    private Integer edadMinima;

    private String availableUntil;

    private String url;

    private String resolution;

    private String audioFileName;

    private String coverFileName;

    @NotBlank(message = "El alias del creador es obligatorio")
    private String creatorAlias;

    public CreateContentRequestDTO() {}

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

    public String getCreatorAlias() {
        return creatorAlias;
    }

    public void setCreatorAlias(String creatorAlias) {
        this.creatorAlias = creatorAlias;
    }
}
