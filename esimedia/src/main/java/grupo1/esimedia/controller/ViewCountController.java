package grupo1.esimedia.controller;

import grupo1.esimedia.content.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para gestionar las reproducciones de contenido.
 */
@RestController
@RequestMapping("/api/views")
@PreAuthorize("hasRole('USER')")
public class ViewCountController {

    @Autowired
    private ContentService contentService;

    private static final String CONTENTID = "contentId";
    private static final String TOTALVIEWS = "totalViews";
    private static final String ERROR = "error";

    /**
     * Registra una reproducción de contenido (incrementa contador en content).
     * POST /api/views/{contentId}
     */
    @PostMapping("/{contentId}")
    public ResponseEntity<?> registerView(@PathVariable String contentId) {
        try {
            contentService.incrementViewCount(contentId);
            Long newCount = contentService.getViewCount(contentId);
            return ResponseEntity.ok(Map.of(
                "message", "Reproducción registrada", 
                CONTENTID, contentId,
                TOTALVIEWS, newCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(ERROR, "Error al registrar reproducción: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el contador de reproducciones de un contenido.
     * GET /api/views/{contentId}
     */
    @GetMapping("/{contentId}")
    public ResponseEntity<?> getViewCount(@PathVariable String contentId) {
        try {
            Long totalViews = contentService.getViewCount(contentId);
            return ResponseEntity.ok(Map.of(
                CONTENTID, contentId,
                TOTALVIEWS, totalViews
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(ERROR, "Error al obtener reproducciones: " + e.getMessage()));
        }
    }

    /**
     * Obtiene solo el total de reproducciones de un contenido.
     * GET /api/views/{contentId}/total
     */
    @GetMapping("/{contentId}/total")
    public ResponseEntity<?> getTotalViews(@PathVariable String contentId) {
        try {
            Long total = contentService.getViewCount(contentId);
            return ResponseEntity.ok(Map.of(CONTENTID, contentId, TOTALVIEWS, total));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(ERROR, "Error al obtener total de reproducciones: " + e.getMessage()));
        }
    }
}