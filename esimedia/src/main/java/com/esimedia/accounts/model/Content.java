package com.esimedia.accounts.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "contents")
public class Content {

    @Id
    private String id;
    private String titulo;
    private String descripcion;
    private String categoria; // Serie, Película, Documental, Infantil
    private String imagen;
    private String year;
    private String duration;
    private String rating; // TP, 12+, 16+, 18+
    private double ratingStars;
    private String videoUrl;
    private List<String> tags;
    private String creatorEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active = true;
    private boolean vipOnly = false;

    public Content() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public double getRatingStars() { return ratingStars; }
    public void setRatingStars(double ratingStars) { this.ratingStars = ratingStars; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getCreatorEmail() { return creatorEmail; }
    public void setCreatorEmail(String creatorEmail) { this.creatorEmail = creatorEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isVipOnly() { return vipOnly; }
    public void setVipOnly(boolean vipOnly) { this.vipOnly = vipOnly; }
}
