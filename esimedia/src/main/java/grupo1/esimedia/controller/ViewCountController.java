package grupo1.esimedia.controller;

import grupo1.esimedia.Content.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para gestionar las reproducciones de contenido.
 */
@RestController
@RequestMapping("/api/views")
@CrossOrigin(origins = "*")
public class ViewCountController {

    @Autowired
    private ContentService contentService;

    /**
     * Registra una reproducción de contenido (incrementa contador en Content).
     * POST /api/views/{contentId}
     */
    @PostMapping("/{contentId}")
    public ResponseEntity<?> registerView(@PathVariable String contentId) {
        try {
            contentService.incrementViewCount(contentId);
            Long newCount = contentService.getViewCount(contentId);
            return ResponseEntity.ok(Map.of(
                "message", "Reproducción registrada", 
                "contentId", contentId,
                "totalViews", newCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Error al registrar reproducción: " + e.getMessage()));
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
                "contentId", contentId,
                "totalViews", totalViews
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Error al obtener reproducciones: " + e.getMessage()));
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
            return ResponseEntity.ok(Map.of("contentId", contentId, "totalViews", total));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Error al obtener total de reproducciones: " + e.getMessage()));
        }
    }
}
