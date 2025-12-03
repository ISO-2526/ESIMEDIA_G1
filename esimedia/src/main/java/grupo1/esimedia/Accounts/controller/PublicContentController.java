package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.Content;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.PublicContentRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/contents")
public class PublicContentController {

    private final PublicContentRepository contentRepository;
    private final TokenRepository tokenRepository;

    public PublicContentController(PublicContentRepository contentRepository, TokenRepository tokenRepository) {
        this.contentRepository = contentRepository;
        this.tokenRepository = tokenRepository;
    }

    // Get all active contents
    @GetMapping
    public ResponseEntity<List<Content>> getAllContents() {
        List<Content> contents = contentRepository.findByActiveTrue();
        return ResponseEntity.ok(contents);
    }

    // Get content by ID
    @GetMapping("/{id}")
    public ResponseEntity<Content> getContentById(@PathVariable String id) {
        var contentOpt = contentRepository.findById(id);
        return contentOpt.map(ResponseEntity::ok).orElse(ResponseEntity.status(404).build());
    }

    // Search content by title
    @GetMapping("/search")
    public ResponseEntity<List<Content>> searchContent(@RequestParam String query) {
        List<Content> contents = contentRepository.findByTituloContainingIgnoreCase(query);
        return ResponseEntity.ok(contents);
    }

    // Get contents by category
    @GetMapping("/category/{categoria}")
    public ResponseEntity<List<Content>> getContentsByCategory(@PathVariable String categoria) {
        List<Content> contents = contentRepository.findByCategoria(categoria);
        return ResponseEntity.ok(contents);
    }

    // Create new content (for creators)
    @PostMapping
    @PreAuthorize("hasRole('CREATOR')")
    public ResponseEntity<Content> createContent(@RequestBody Content content) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .orElse("user");

        content.setCreatorEmail(email);
        content.setCreatedAt(LocalDateTime.now());
        content.setUpdatedAt(LocalDateTime.now());
        content.setActive(true);
        
        Content saved = contentRepository.save(content);
        return ResponseEntity.ok(saved);
    }

    // Update content
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CREATOR')")
    public ResponseEntity<Content> updateContent(
            @PathVariable String id,
            @RequestBody Content updates) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        var contentOpt = contentRepository.findById(id);
        if (contentOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Content content = contentOpt.get();
        
        // Only creator can update
        if (!content.getCreatorEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        // Update fields
        if (updates.getTitulo() != null) content.setTitulo(updates.getTitulo());
        if (updates.getDescripcion() != null) content.setDescripcion(updates.getDescripcion());
        if (updates.getCategoria() != null) content.setCategoria(updates.getCategoria());
        if (updates.getImagen() != null) content.setImagen(updates.getImagen());
        if (updates.getYear() != null) content.setYear(updates.getYear());
        if (updates.getDuration() != null) content.setDuration(updates.getDuration());
        if (updates.getRating() != null) content.setRating(updates.getRating());
        if (updates.getRatingStars() > 0) content.setRatingStars(updates.getRatingStars());
        if (updates.getVideoUrl() != null) content.setVideoUrl(updates.getVideoUrl());
        if (updates.getTags() != null) content.setTags(updates.getTags());
        
        content.setUpdatedAt(LocalDateTime.now());
        
        Content saved = contentRepository.save(content);
        return ResponseEntity.ok(saved);
    }

    // Delete content (soft delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CREATOR')")
    public ResponseEntity<String> deleteContent(@PathVariable String id
                                                ) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        var contentOpt = contentRepository.findById(id);
        if (contentOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Content content = contentOpt.get();
        
        // Only creator can delete
        if (!content.getCreatorEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        content.setActive(false);
        content.setUpdatedAt(LocalDateTime.now());
        contentRepository.save(content);
        
        return ResponseEntity.ok("Content deactivated successfully");
    }
}
