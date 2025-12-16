package com.esimedia.content.service;

import org.springframework.stereotype.Service;

import com.esimedia.accounts.repository.TokenRepository;
import com.esimedia.content.dto.StatisticsDTO;
import com.esimedia.content.model.Content;
import com.esimedia.content.repository.CreatorContentRepository;
import com.esimedia.model.Rating;
import com.esimedia.repository.RatingRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final CreatorContentRepository contentRepository;
    private final RatingRepository ratingRepository;
    private final TokenRepository tokenRepository;

    public StatisticsService(
            CreatorContentRepository contentRepository,
            RatingRepository ratingRepository,
            TokenRepository tokenRepository) {
        this.contentRepository = contentRepository;
        this.ratingRepository = ratingRepository;
        this.tokenRepository = tokenRepository;
    }

    /**
     * Verifica que el token sea válido
     */
    private void verifyAuthentication(String tokenId) {
        if (tokenId == null || tokenId.isEmpty()) {
            throw new RuntimeException("No autenticado");
        }
        if (!tokenRepository.findById(tokenId).isPresent()) {
            throw new RuntimeException("Token inválido");
        }
    }

    /**
     * Top 5 contenidos por reproducciones
     */
    public List<StatisticsDTO.TopByViewsDTO> getTopByViews(String tokenId) {
        verifyAuthentication(tokenId);
        
        List<Content> contents = contentRepository.findAll();

        return contents.stream()
                .sorted((a, b) -> Long.compare(
                        b.getViewCount() != null ? b.getViewCount() : 0L,
                        a.getViewCount() != null ? a.getViewCount() : 0L))
                .limit(5)
                .map(content -> new StatisticsDTO.TopByViewsDTO(
                        content.getId(),
                        content.getTitle(),
                        content.getType().toString(),
                        content.getViewCount() != null ? content.getViewCount() : 0L))
                .collect(Collectors.toList());
    }

    /**
     * Top 5 contenidos por valoraciones
     */
    public List<StatisticsDTO.TopByRatingsDTO> getTopByRatings(String tokenId) {
        verifyAuthentication(tokenId);
        
        List<Content> contents = contentRepository.findAll();

        // Calcular la media y número de valoraciones para cada contenido
        List<StatisticsDTO.TopByRatingsDTO> contentWithRatings = new ArrayList<>();

        for (Content content : contents) {
            List<Rating> ratings = ratingRepository.findByContentId(content.getId());
            
            if (!ratings.isEmpty()) {
                double averageRating = ratings.stream()
                        .mapToDouble(Rating::getRating)
                        .average()
                        .orElse(0.0);

                contentWithRatings.add(new StatisticsDTO.TopByRatingsDTO(
                        content.getId(),
                        content.getTitle(),
                        content.getType().toString(),
                        Math.round(averageRating * 10.0) / 10.0, // Redondear a 1 decimal
                        (long) ratings.size()));
            }
        }

        // Ordenar por media de valoraciones descendente
        return contentWithRatings.stream()
                .sorted((a, b) -> Double.compare(b.averageRating(), a.averageRating()))
                .limit(5)
                .collect(Collectors.toList());
    }

    /**
     * Top 5 categorías (tags) más vistas
     */
    public List<StatisticsDTO.TopByCategoriesDTO> getTopByCategories(String tokenId) {
        verifyAuthentication(tokenId);        List<Content> contents = contentRepository.findAll();

        // Agrupar por tag y sumar las vistas
        Map<String, StatisticsDTO.CategoryStats> categoryMap = new HashMap<>();

        for (Content content : contents) {
            List<String> tags = content.getTags();
            if (tags != null && !tags.isEmpty()) {
                Long views = content.getViewCount() != null ? content.getViewCount() : 0L;

                // Procesar cada tag del contenido
                for (String tag : tags) {
                    String categoryKey = tag.trim();
                    if (!categoryKey.isEmpty()) {
                        categoryMap.merge(
                                categoryKey,
                                new StatisticsDTO.CategoryStats(categoryKey, views, 1L),
                                (existing, newVal) -> new StatisticsDTO.CategoryStats(
                                        existing.category(),
                                        existing.totalViews() + newVal.totalViews(),
                                        existing.contentCount() + 1L));
                    }
                }
            }
        }

        // Convertir a lista, ordenar por vistas totales y tomar top 5
        return categoryMap.values().stream()
                .sorted((a, b) -> Long.compare(b.totalViews(), a.totalViews()))
                .limit(5)
                .map(stats -> new StatisticsDTO.TopByCategoriesDTO(
                        stats.category(),
                        stats.totalViews(),
                        stats.contentCount()))
                .collect(Collectors.toList());
    }
}
