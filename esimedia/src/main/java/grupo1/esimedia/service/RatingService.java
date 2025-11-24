package grupo1.esimedia.service;

import grupo1.esimedia.dto.RatingRequestDTO;
import grupo1.esimedia.dto.RatingResponseDTO;
import grupo1.esimedia.dto.RatingStatsDTO;
import grupo1.esimedia.model.Rating;
import grupo1.esimedia.repository.RatingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar las valoraciones de contenido.
 */
@Service
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    /**
     * Crea o actualiza una valoración de un usuario para un contenido.
     */
    @Transactional
    public RatingResponseDTO saveOrUpdateRating(String userId, RatingRequestDTO request) {
        Optional<Rating> existingRating = ratingRepository.findByUserIdAndContentId(
            userId, 
            request.getContentId()
        );

        Rating rating;
        if (existingRating.isPresent()) {
            // Actualizar valoración existente
            rating = existingRating.get();
            rating.setRating(request.getRating());
        } else {
            // Crear nueva valoración
            rating = new Rating(userId, request.getContentId(), request.getRating());
        }

        rating = ratingRepository.save(rating);
        return convertToResponseDTO(rating);
    }

    /**
     * Obtiene la valoración de un usuario para un contenido específico.
     */
    public Optional<RatingResponseDTO> getUserRating(String userId, String contentId) {
        return ratingRepository.findByUserIdAndContentId(userId, contentId)
            .map(this::convertToResponseDTO);
    }

    /**
     * Obtiene todas las valoraciones de un contenido.
     */
    public List<RatingResponseDTO> getContentRatings(String contentId) {
        return ratingRepository.findByContentId(contentId).stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene las estadísticas completas de valoraciones de un contenido.
     */
    public RatingStatsDTO getContentRatingStats(String contentId) {
        // Obtener todas las valoraciones del contenido
        List<Rating> ratings = ratingRepository.findByContentId(contentId);
        
        if (ratings.isEmpty()) {
            return new RatingStatsDTO(contentId, 0.0, 0L, new LinkedHashMap<>());
        }
        
        // Calcular promedio manualmente
        double sum = 0.0;
        for (Rating rating : ratings) {
            sum += rating.getRating();
        }
        double average = Math.round((sum / ratings.size()) * 10.0) / 10.0;
        long total = ratings.size();
        
        // Calcular distribución manualmente
        Map<Double, Long> distribution = new LinkedHashMap<>();
        for (Rating rating : ratings) {
            Double ratingValue = rating.getRating();
            distribution.put(ratingValue, distribution.getOrDefault(ratingValue, 0L) + 1);
        }
        
        // Ordenar por rating descendente
        Map<Double, Long> sortedDistribution = distribution.entrySet().stream()
            .sorted(Map.Entry.<Double, Long>comparingByKey().reversed())
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (e1, e2) -> e1,
                LinkedHashMap::new
            ));

        return new RatingStatsDTO(contentId, average, total, sortedDistribution);
    }

    /**
     * Obtiene los contenidos con mejor valoración (trending).
     */
    public List<Map<String, Object>> getTopRatedContent(int minRatings, int limit) {
        // Obtener todas las valoraciones
        List<Rating> allRatings = ratingRepository.findAll();
        
        // Agrupar por contentId y calcular estadísticas
        Map<String, List<Rating>> groupedByContent = allRatings.stream()
            .collect(Collectors.groupingBy(Rating::getContentId));
        
        // Calcular promedio y filtrar por mínimo de valoraciones
        List<Map<String, Object>> contentStats = new ArrayList<>();
        for (Map.Entry<String, List<Rating>> entry : groupedByContent.entrySet()) {
            List<Rating> contentRatings = entry.getValue();
            if (contentRatings.size() >= minRatings) {
                double average = contentRatings.stream()
                    .mapToDouble(Rating::getRating)
                    .average()
                    .orElse(0.0);
                
                Map<String, Object> map = new HashMap<>();
                map.put("contentId", entry.getKey());
                map.put("averageRating", Math.round(average * 10.0) / 10.0);
                map.put("totalRatings", (long) contentRatings.size());
                contentStats.add(map);
            }
        }
        
        // Ordenar por promedio descendente y luego por total
        contentStats.sort((a, b) -> {
            int avgCompare = Double.compare(
                (Double) b.get("averageRating"), 
                (Double) a.get("averageRating")
            );
            if (avgCompare != 0) return avgCompare;
            return Long.compare(
                (Long) b.get("totalRatings"), 
                (Long) a.get("totalRatings")
            );
        });
        
        // Limitar resultados
        return contentStats.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Elimina una valoración de un usuario para un contenido.
     */
    @Transactional
    public boolean deleteRating(String userId, String contentId) {
        if (ratingRepository.existsByUserIdAndContentId(userId, contentId)) {
            ratingRepository.deleteByUserIdAndContentId(userId, contentId);
            return true;
        }
        return false;
    }

    /**
     * Obtiene todas las valoraciones de un usuario.
     */
    public List<RatingResponseDTO> getUserRatings(String userId) {
        return ratingRepository.findByUserId(userId).stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }

    /**
     * Verifica si un usuario ya ha valorado un contenido.
     */
    public boolean hasUserRated(String userId, String contentId) {
        return ratingRepository.existsByUserIdAndContentId(userId, contentId);
    }

    /**
     * Calcula el promedio de valoraciones para un contenido específico.
     * Consulta la tabla ratings y calcula la media de todas las valoraciones para ese contentId.
     * @param contentId ID del contenido
     * @return Promedio de valoraciones (0.0 si no tiene valoraciones)
     */
    public double getAverageRatingByContentId(String contentId) {
        List<Rating> ratings = ratingRepository.findByContentId(contentId);
        
        if (ratings.isEmpty()) {
            return 0.0;
        }
        
        double sum = 0.0;
        for (Rating rating : ratings) {
            sum += rating.getRating();
        }
        
        double average = sum / ratings.size();
        // Redondear a 1 decimal
        return Math.round(average * 10.0) / 10.0;
    }

    /**
     * Convierte una entidad Rating a RatingResponseDTO.
     */
    private RatingResponseDTO convertToResponseDTO(Rating rating) {
        return new RatingResponseDTO(
            rating.getId(),
            rating.getUserId(),
            rating.getContentId(),
            rating.getRating(),
            rating.getCreatedAt(),
            rating.getUpdatedAt()
        );
    }
}
