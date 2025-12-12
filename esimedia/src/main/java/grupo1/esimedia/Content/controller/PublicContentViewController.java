package grupo1.esimedia.Content.controller;

import grupo1.esimedia.Content.dto.ContentWithRating;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import grupo1.esimedia.service.RatingService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/contents")
@PreAuthorize("hasRole('USER')")
public class PublicContentViewController {

    private final CreatorContentRepository contentRepository;
    private final RatingService ratingService;
    private final UserRepository userRepository;

    public PublicContentViewController(CreatorContentRepository contentRepository, RatingService ratingService, UserRepository userRepository) {
        this.contentRepository = contentRepository;
        this.ratingService = ratingService;
        this.userRepository = userRepository;
    }

    /**
     * Verifica si el contenido es accesible por el usuario autenticado.
     */
    private boolean isContentAccessible(Content content) {
        // 1. Debe ser PUBLICO
        if (content.getState() != ContentState.PUBLICO) {
            return false;
        }

        // 2. Si no es VIP_ONLY, es accesible.
        if (!content.isVipOnly()) {
            return true;
        }

        // 3. Si es VIP_ONLY, verificar el usuario autenticado.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName(); // El email del usuario autenticado (el principal)

        Optional<User> userOpt = userRepository.findById(userEmail);
        
        // Si el usuario existe Y es VIP, permitir acceso.
        return userOpt.isPresent() && userOpt.get().isVip();
    }

    // Get all public (PUBLICO) contents with their average rating calculated from ratings table
    @GetMapping
    public ResponseEntity<List<ContentWithRating>> getAllPublicContents() {
        List<Content> allPublic = contentRepository.findByState(ContentState.PUBLICO);

        // ✅ FILTRAR: Solo se incluyen los contenidos accesibles para el usuario
        List<ContentWithRating> contentsWithRating = allPublic.stream()
            .filter(this::isContentAccessible)
            .map(content -> {
                double avgRating = ratingService.getAverageRatingByContentId(content.getId());
                return new ContentWithRating(content, avgRating);
            })
            .toList();

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

        // ✅ VALIDACIÓN: Si el contenido no es accesible (ej. es VIP y el usuario no), devolver 403
        if (!isContentAccessible(content)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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
            .filter(this::isContentAccessible)
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

        // ✅ FILTRAR: Se filtra por creador Y por accesibilidad VIP
        List<ContentWithRating> contentsWithRating = contents.stream()
            .filter(this::isContentAccessible)
            .map(content -> {
                double avgRating = ratingService.getAverageRatingByContentId(content.getId());
                return new ContentWithRating(content, avgRating);
            })
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(contentsWithRating);
    }
}
