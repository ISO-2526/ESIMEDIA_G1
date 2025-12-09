package grupo1.esimedia.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import grupo1.esimedia.dto.RatingRequestDTO;
import grupo1.esimedia.dto.RatingResponseDTO;
import grupo1.esimedia.dto.RatingStatsDTO;
import grupo1.esimedia.service.RatingService;
import jakarta.validation.Valid;

/**
 * Controlador REST para gestionar las valoraciones de contenido.
 */
@RestController
@RequestMapping("/api/ratings")
@PreAuthorize("hasRole('USER')")
public class RatingController {

    private static final String ERROR = "error";

    @Autowired
    private RatingService ratingService;


    /**
     * Crea o actualiza una valoración del usuario autenticado.
     * POST /api/ratings
     */
    @PostMapping
    public ResponseEntity<?> saveRating(@Valid @RequestBody RatingRequestDTO request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            RatingResponseDTO response = ratingService.saveOrUpdateRating(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(ERROR, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al guardar la valoración: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la valoración del usuario autenticado para un contenido específico.
     * GET /api/ratings/user/{contentId}
     */
    @GetMapping("/user/{contentId}")
    public ResponseEntity<?> getUserRating(@PathVariable String contentId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            Optional<RatingResponseDTO> rating = ratingService.getUserRating(userId, contentId);
            if (rating.isPresent()) {
                return ResponseEntity.ok(rating.get());
            } else {
                return ResponseEntity.ok(Map.of("hasRating", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener la valoración: " + e.getMessage()));
        }
    }

    /**
     * Obtiene todas las valoraciones de un contenido específico.
     * GET /api/ratings/{contentId}
     */
    @GetMapping("/{contentId}")
    public ResponseEntity<?> getContentRatings(@PathVariable String contentId) {
        try {
            List<RatingResponseDTO> ratings = ratingService.getContentRatings(contentId);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener las valoraciones: " + e.getMessage()));
        }
    }

    /**
     * Obtiene las estadísticas de valoración de un contenido (promedio, total, distribución).
     * GET /api/ratings/stats/{contentId}
     */
    @GetMapping("/stats/{contentId}")
    public ResponseEntity<?> getContentStats(@PathVariable String contentId) {
        try {
            RatingStatsDTO stats = ratingService.getContentRatingStats(contentId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener las estadísticas: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el promedio de valoración de un contenido.
     * GET /api/ratings/average/{contentId}
     */
    @GetMapping("/average/{contentId}")
    public ResponseEntity<?> getAverageRating(@PathVariable String contentId) {
        try {
            RatingStatsDTO stats = ratingService.getContentRatingStats(contentId);
            return ResponseEntity.ok(Map.of(
                "contentId", stats.getContentId(),
                "averageRating", stats.getAverageRating(),
                "totalRatings", stats.getTotalRatings()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener el promedio: " + e.getMessage()));
        }
    }

    /**
     * Obtiene los contenidos con mejor valoración (trending).
     * GET /api/ratings/trending?minRatings=5&limit=10
     */
    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingContent(
            @RequestParam(defaultValue = "5") int minRatings,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> trending = ratingService.getTopRatedContent(minRatings, limit);
            return ResponseEntity.ok(trending);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener contenido trending: " + e.getMessage()));
        }
    }

    /**
     * Elimina la valoración del usuario autenticado para un contenido.
     * DELETE /api/ratings/{contentId}
     */
    @DeleteMapping("/{contentId}")
    public ResponseEntity<?> deleteRating(@PathVariable String contentId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();            


            boolean deleted = ratingService.deleteRating(userId, contentId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Valoración eliminada correctamente"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(ERROR, "No se encontró la valoración"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al eliminar la valoración: " + e.getMessage()));
        }
    }

    /**
     * Obtiene todas las valoraciones del usuario autenticado.
     * GET /api/ratings/user/all
     */
    @GetMapping("/user/all")
    public ResponseEntity<?> getAllUserRatings() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            List<RatingResponseDTO> ratings = ratingService.getUserRatings(userId);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al obtener las valoraciones: " + e.getMessage()));
        }
    }




}
