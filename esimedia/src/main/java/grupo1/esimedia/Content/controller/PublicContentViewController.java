package grupo1.esimedia.Content.controller;

import grupo1.esimedia.Content.dto.ContentWithRating;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import grupo1.esimedia.service.RatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/contents")
@PreAuthorize("permitAll()") // ✅ Público - cualquiera puede ver contenidos
public class PublicContentViewController {

    private final CreatorContentRepository contentRepository;
    private final RatingService ratingService;

    public PublicContentViewController(CreatorContentRepository contentRepository, RatingService ratingService) {
        this.contentRepository = contentRepository;
        this.ratingService = ratingService;
    }

    // Get all public (PUBLICO) contents with their average rating calculated from ratings table
    @GetMapping
    public ResponseEntity<List<ContentWithRating>> getAllPublicContents() {
        List<Content> contents = contentRepository.findByState(ContentState.PUBLICO);
        
        // Calcular el rating promedio para cada contenido desde la tabla ratings
        List<ContentWithRating> contentsWithRating = contents.stream()
            .map(content -> {
                double avgRating = ratingService.getAverageRatingByContentId(content.getId());
                return new ContentWithRating(content, avgRating);
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(contentsWithRating);
    }

    // Get content by ID (only if public) with average rating
    @GetMapping("/{id}")
    public ResponseEntity<ContentWithRating> getContentById(@PathVariable String id) {
        var contentOpt = contentRepository.findById(id);
        if (contentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Content content = contentOpt.get();
        if (content.getState() != ContentState.PUBLICO) {
            return ResponseEntity.status(403).build();
        }
        
        double avgRating = ratingService.getAverageRatingByContentId(content.getId());
        ContentWithRating contentWithRating = new ContentWithRating(content, avgRating);
        
        return ResponseEntity.ok(contentWithRating);
    }

    // Search content by title (only public) with average ratings
    @GetMapping("/search")
    public ResponseEntity<List<ContentWithRating>> searchContent(@RequestParam String query) {
        List<Content> allPublic = contentRepository.findByState(ContentState.PUBLICO);
        List<ContentWithRating> filtered = allPublic.stream()
                .filter(c -> c.getTitle().toLowerCase().contains(query.toLowerCase()))
                .map(content -> {
                    double avgRating = ratingService.getAverageRatingByContentId(content.getId());
                    return new ContentWithRating(content, avgRating);
                })
                .toList();
        return ResponseEntity.ok(filtered);
    }

    // Get contents by creator alias (only public) with average ratings
    @GetMapping("/creator/{alias}")
    public ResponseEntity<List<ContentWithRating>> getContentsByCreator(@PathVariable String alias) {
        List<Content> contents = contentRepository.findByCreatorAliasAndState(alias, ContentState.PUBLICO);
        List<ContentWithRating> contentsWithRating = contents.stream()
                .map(content -> {
                    double avgRating = ratingService.getAverageRatingByContentId(content.getId());
                    return new ContentWithRating(content, avgRating);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(contentsWithRating);
    }
}
