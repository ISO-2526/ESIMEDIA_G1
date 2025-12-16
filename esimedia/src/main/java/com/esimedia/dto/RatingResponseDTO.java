package com.esimedia.dto;

import java.time.LocalDateTime;

/**
 * DTO para devolver información de una valoración.
 */
public class RatingResponseDTO {

    private String id;
    private String userId;
    private String contentId;
    private Double rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public RatingResponseDTO() {
    }

    public RatingResponseDTO(String id, String userId, String contentId, Double rating, 
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.contentId = contentId;
        this.rating = rating;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    @Override
    public String toString() {
        return "RatingResponseDTO{" +
                "id=" + id +
                ", userId=" + userId +
                ", contentId=" + contentId +
                ", rating=" + rating +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
