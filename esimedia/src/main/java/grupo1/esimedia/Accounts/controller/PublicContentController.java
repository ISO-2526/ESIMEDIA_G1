package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.Content;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.PublicContentRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/contents")
@CrossOrigin(origins = "http://localhost:3000")
public class PublicContentController {

    private final PublicContentRepository contentRepository;
    private final TokenRepository tokenRepository;

    public PublicContentController(PublicContentRepository contentRepository, TokenRepository tokenRepository) {
        this.contentRepository = contentRepository;
        this.tokenRepository = tokenRepository;
    }

    private Optional<Token> resolveValidToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return Optional.empty();
        Optional<Token> tok = tokenRepository.findById(tokenId);
        if (tok.isEmpty()) return Optional.empty();
        Token t = tok.get();
        if (t.getExpiration() != null && t.getExpiration().isBefore(java.time.LocalDateTime.now())) return Optional.empty();
        return Optional.of(t);
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
    public ResponseEntity<Content> createContent(@RequestBody Content content,
                                                 @CookieValue(value = "access_token", required = false) String tokenId) {
        var tokenOpt = resolveValidToken(tokenId);
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).build();
        Token token = tokenOpt.get();
        String role = token.getRole();
        if (role == null || (!role.equals("creator") && !role.equals("admin"))) return ResponseEntity.status(403).build();

        content.setCreatorEmail(token.getAccountId());
        content.setCreatedAt(LocalDateTime.now());
        content.setUpdatedAt(LocalDateTime.now());
        content.setActive(true);
        
        Content saved = contentRepository.save(content);
        return ResponseEntity.ok(saved);
    }

    // Update content
    @PutMapping("/{id}")
    public ResponseEntity<Content> updateContent(
            @PathVariable String id,
            @RequestBody Content updates,
            @CookieValue(value = "access_token", required = false) String tokenId) {
        var tokenOpt = resolveValidToken(tokenId);
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).build();
        Token token = tokenOpt.get();
        String userEmail = token.getAccountId();
        String role = token.getRole();
        
        var contentOpt = contentRepository.findById(id);
        if (contentOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Content content = contentOpt.get();
        
        // Only creator or admin can update
        if (!content.getCreatorEmail().equals(userEmail) && !"admin".equals(role)) {
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
    public ResponseEntity<String> deleteContent(@PathVariable String id,
                                                @CookieValue(value = "access_token", required = false) String tokenId) {
        var tokenOpt = resolveValidToken(tokenId);
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).build();
        Token token = tokenOpt.get();
        String userEmail = token.getAccountId();
        String role = token.getRole();
        
        var contentOpt = contentRepository.findById(id);
        if (contentOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Content content = contentOpt.get();
        
        // Only creator or admin can delete
        if (!content.getCreatorEmail().equals(userEmail) && !"admin".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        
        content.setActive(false);
        content.setUpdatedAt(LocalDateTime.now());
        contentRepository.save(content);
        
        return ResponseEntity.ok("Content deactivated successfully");
    }
}
