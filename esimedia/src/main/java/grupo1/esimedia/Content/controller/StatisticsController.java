package grupo1.esimedia.Content.controller;

import grupo1.esimedia.Content.dto.StatisticsDTO;
import grupo1.esimedia.Content.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/creator/statistics")
@CrossOrigin(origins = "http://localhost:3000")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    // Top 5 de contenidos por reproducciones
    @GetMapping("/top-views")
    public ResponseEntity<List<StatisticsDTO.TopByViewsDTO>> getTopByViews(
            @CookieValue(value = "access_token", required = false) String tokenId) {
        
        if (tokenId == null || tokenId.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<StatisticsDTO.TopByViewsDTO> result = statisticsService.getTopByViews(tokenId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }


    // Top 5 de contenidos por valoraciones
    @GetMapping("/top-ratings")
    public ResponseEntity<List<StatisticsDTO.TopByRatingsDTO>> getTopByRatings(
            @CookieValue(value = "access_token", required = false) String tokenId) {
        
        if (tokenId == null || tokenId.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<StatisticsDTO.TopByRatingsDTO> result = statisticsService.getTopByRatings(tokenId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }


    // Top 5 de categorías (tags) más vistas
    @GetMapping("/top-categories")
    public ResponseEntity<List<StatisticsDTO.TopByCategoriesDTO>> getTopByCategories(
            @CookieValue(value = "access_token", required = false) String tokenId) {
        
        if (tokenId == null || tokenId.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<StatisticsDTO.TopByCategoriesDTO> result = statisticsService.getTopByCategories(tokenId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
