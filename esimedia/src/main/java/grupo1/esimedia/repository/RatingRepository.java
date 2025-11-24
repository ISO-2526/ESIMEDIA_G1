package grupo1.esimedia.repository;

import grupo1.esimedia.model.Rating;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio MongoDB para gestionar las valoraciones de contenido.
 */
@Repository
public interface RatingRepository extends MongoRepository<Rating, String> {

    /**
     * Busca una valoración específica de un usuario para un contenido.
     */
    Optional<Rating> findByUserIdAndContentId(String userId, String contentId);

    /**
     * Obtiene todas las valoraciones de un contenido específico.
     */
    List<Rating> findByContentId(String contentId);

    /**
     * Obtiene todas las valoraciones de un usuario específico.
     */
    List<Rating> findByUserId(String userId);

    /**
     * Cuenta el número total de valoraciones para un contenido.
     */
    Long countByContentId(String contentId);

    /**
     * Verifica si un usuario ya ha valorado un contenido.
     */
    boolean existsByUserIdAndContentId(String userId, String contentId);

    /**
     * Elimina una valoración específica de un usuario para un contenido.
     */
    void deleteByUserIdAndContentId(String userId, String contentId);

    /**
     * Obtiene estadísticas agregadas de valoraciones por contentId.
     * Calcula promedio, total de valoraciones y distribución.
     */
    @Aggregation(pipeline = {
        "{ $match: { contentId: ?0 } }",
        "{ $group: { " +
        "    _id: null, " +
        "    averageRating: { $avg: '$rating' }, " +
        "    totalRatings: { $sum: 1 }, " +
        "    minRating: { $min: '$rating' }, " +
        "    maxRating: { $max: '$rating' } " +
        "} }"
    })
    List<RatingStats> getContentStats(String contentId);

    /**
     * Obtiene la distribución de valoraciones por estrellas para un contenido.
     */
    @Aggregation(pipeline = {
        "{ $match: { contentId: ?0 } }",
        "{ $group: { " +
        "    _id: '$rating', " +
        "    count: { $sum: 1 } " +
        "} }",
        "{ $sort: { _id: -1 } }"
    })
    List<RatingDistribution> getRatingDistribution(String contentId);

    /**
     * Obtiene los contenidos mejor valorados (trending).
     * Requiere un mínimo de valoraciones y devuelve top N.
     */
    @Aggregation(pipeline = {
        "{ $group: { " +
        "    _id: '$contentId', " +
        "    averageRating: { $avg: '$rating' }, " +
        "    totalRatings: { $sum: 1 } " +
        "} }",
        "{ $match: { totalRatings: { $gte: ?0 } } }",
        "{ $sort: { averageRating: -1, totalRatings: -1 } }",
        "{ $limit: ?1 }"
    })
    List<ContentRatingAggregate> findTopRatedContent(int minRatings, int limit);

    /**
     * Interface de proyección para estadísticas.
     */
    interface RatingStats {
        Double getAverageRating();
        Long getTotalRatings();
        Double getMinRating();
        Double getMaxRating();
    }

    /**
     * Interface de proyección para distribución.
     */
    interface RatingDistribution {
        Double getId(); // El rating (0.5, 1.0, etc.)
        Long getCount();
    }

    /**
     * Interface de proyección para contenido agregado.
     */
    interface ContentRatingAggregate {
        String getId(); // El contentId (String porque es ObjectId de MongoDB)
        Double getAverageRating();
        Long getTotalRatings();
    }
}
