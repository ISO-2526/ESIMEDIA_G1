package com.esimedia.content.dto;

/**
 * DTOs para estadísticas
 */
public class StatisticsDTO {

    /**
     * DTO para el top de contenidos por reproducciones
     */
    public record TopByViewsDTO(
        String id,
        String title,
        String type,
        Long views
    ) {}

    /**
     * DTO para el top de contenidos por valoraciones
     */
    public record TopByRatingsDTO(
        String id,
        String title,
        String type,
        Double averageRating,
        Long ratingCount
    ) {}

    /**
     * DTO para el top de categorías más vistas
     */
    public record TopByCategoriesDTO(
        String category,
        Long totalViews,
        Long contentCount
    ) {}

    /**
     * DTO auxiliar para agregación de categorías
     */
    public record CategoryStats(
        String category,
        Long totalViews,
        Long contentCount
    ) {}
}
