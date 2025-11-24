package grupo1.esimedia.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import grupo1.esimedia.Accounts.repository.TokenRepository;
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
@CrossOrigin(origins = "*")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private TokenRepository tokenRepository;

    /**
     * Crea o actualiza una valoración del usuario autenticado.
     * POST /api/ratings
     */
    @PostMapping
    public ResponseEntity<?> saveRating(@Valid @RequestBody RatingRequestDTO request) {
        try {
            String userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            RatingResponseDTO response = ratingService.saveOrUpdateRating(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al guardar la valoración: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la valoración del usuario autenticado para un contenido específico.
     * GET /api/ratings/user/{contentId}
     */
    @GetMapping("/user/{contentId}")
    public ResponseEntity<?> getUserRating(@PathVariable String contentId) {
        try {
            String userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            Optional<RatingResponseDTO> rating = ratingService.getUserRating(userId, contentId);
            if (rating.isPresent()) {
                return ResponseEntity.ok(rating.get());
            } else {
                return ResponseEntity.ok(Map.of("hasRating", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al obtener la valoración: " + e.getMessage()));
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
                .body(Map.of("error", "Error al obtener las valoraciones: " + e.getMessage()));
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
                .body(Map.of("error", "Error al obtener las estadísticas: " + e.getMessage()));
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
                .body(Map.of("error", "Error al obtener el promedio: " + e.getMessage()));
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
                .body(Map.of("error", "Error al obtener contenido trending: " + e.getMessage()));
        }
    }

    /**
     * Elimina la valoración del usuario autenticado para un contenido.
     * DELETE /api/ratings/{contentId}
     */
    @DeleteMapping("/{contentId}")
    public ResponseEntity<?> deleteRating(@PathVariable String contentId) {
        try {
            String userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            boolean deleted = ratingService.deleteRating(userId, contentId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Valoración eliminada correctamente"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No se encontró la valoración"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al eliminar la valoración: " + e.getMessage()));
        }
    }

    /**
     * Obtiene todas las valoraciones del usuario autenticado.
     * GET /api/ratings/user/all
     */
    @GetMapping("/user/all")
    public ResponseEntity<?> getAllUserRatings() {
        try {
            String userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            List<RatingResponseDTO> ratings = ratingService.getUserRatings(userId);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al obtener las valoraciones: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el ID del usuario autenticado desde cookie, header o contexto de seguridad.
     */
    private String getCurrentUserId() {
        return firstNonBlank(
                getUserIdFromCookie(),
                getUserIdFromHeader(),
                getAccountIdFromSecurityContext()
        );
    }

    /**
     * Lee el usuario del header X-User-Email (si está presente).
     */
    private String getUserIdFromHeader() {
        jakarta.servlet.http.HttpServletRequest request = getCurrentHttpRequest();
        if (request == null) return null;

        String headerUser = request.getHeader("X-User-Email");
        return (headerUser == null || headerUser.isBlank()) ? null : headerUser;
    }

    /**
     * Devuelve el primer valor no nulo ni en blanco.
     */
    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    private String getUserIdFromCookie() {
        jakarta.servlet.http.HttpServletRequest request = getCurrentHttpRequest();
        if (request == null) return null;

        String tokenId = getCookieValue(request.getCookies(), "access_token");
        if (tokenId == null || tokenId.isBlank()) return null;

        return validateAndGetAccountId(tokenId);
    }

    private jakarta.servlet.http.HttpServletRequest getCurrentHttpRequest() {
        org.springframework.web.context.request.RequestAttributes attrs =
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private String getCookieValue(jakarta.servlet.http.Cookie[] cookies, String name) {
        if (cookies == null || name == null) return null;
        for (jakarta.servlet.http.Cookie c : cookies) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }

    private String validateAndGetAccountId(String tokenId) {
        return tokenRepository.findById(tokenId)
                .filter(t -> t.getExpiration() == null || !t.getExpiration().isBefore(java.time.LocalDateTime.now()))
                .map(grupo1.esimedia.Accounts.model.Token::getAccountId)
                .orElse(null);
    }

    private String getAccountIdFromSecurityContext() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return null;
        Object principal = authentication.getPrincipal();
        if ("anonymousUser".equals(principal)) return null;
        return authentication.getName();
    }
}
