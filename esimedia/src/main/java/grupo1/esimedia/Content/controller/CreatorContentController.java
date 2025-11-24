package grupo1.esimedia.Content.controller;

import grupo1.esimedia.Accounts.model.ContentType;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Content.service.ContentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/creator/contents")
@CrossOrigin(origins = "http://localhost:3000")
public class CreatorContentController {

    private final ContentService service;
    private final TokenRepository tokenRepository;
    private final ContentCreatorRepository creatorRepository;

    public CreatorContentController(ContentService service, TokenRepository tokenRepository,
            ContentCreatorRepository creatorRepository) {
        this.service = service;
        this.tokenRepository = tokenRepository;
        this.creatorRepository = creatorRepository;
    }

    // DTOs
    public record CreateRequest(
            ContentType type,
            String title,
            String description,
            List<String> tags,
            Boolean vipOnly,
            Integer durationMinutes,
            Integer edadMinima,
            String availableUntil,
            String url,
            String resolution,
            String audioFileName,
            String coverFileName,
            String creatorAlias) {
    }

    public record UpdateRequest(
            String title,
            String description,
            List<String> tags,
            Boolean vipOnly,
            Integer durationMinutes,
            Integer edadMinima,
            String availableUntil,
            String coverFileName,
            String state) {
    }

    @GetMapping
    public List<Content> list() {
        return service.findAll();
    }

    @GetMapping("/creator/{alias}")
    public List<Content> listByCreator(@PathVariable String alias) {
        return service.findByCreatorAlias(alias);
    }

    @PostMapping
    public ResponseEntity<Object> create(
            @CookieValue(value = "access_token", required = false) String tokenId,
            @Valid @RequestBody CreateRequest req) {
        ContentType actorType = resolveContentTypeFromToken(tokenId);
        try {
            Content saved = service.create(req, actorType);
            return ResponseEntity.created(URI.create("/api/creator/contents/" + saved.getId())).body(saved);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((Object) Map.of("message", ex.getReason(), "status", 400));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable String id,
            @CookieValue(value = "access_token", required = false) String tokenId,
            @Valid @RequestBody UpdateRequest req) {
        ContentType actorType = resolveContentTypeFromToken(tokenId);
        try {
            var opt = service.update(id, req, actorType);
            if (opt.isPresent()) {
                return ResponseEntity.ok((Object) opt.get());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body((Object) Map.of("message", "No encontrado", "status", 404));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getReason(), "status", 400));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable String id,
            @CookieValue(value = "access_token", required = false) String tokenId) {
        ContentType actorContentType = resolveContentTypeFromToken(tokenId);
        return service.findById(id)
                .map(existing -> {
                    if (actorContentType == null) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) java.util.Map.of("message",
                                "Token no proporcionado o inválido", "status", 403));
                    }
                    if (!existing.getType().equals(actorContentType)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) java.util.Map.of("message",
                                "No estás autorizado para eliminar contenidos de este tipo", "status", 403));
                    }
                    boolean deleted = service.delete(id);
                    return deleted
                            ? ResponseEntity.status(HttpStatus.NO_CONTENT)
                                    .body((Object) java.util.Map.of("message", "Eliminado", "status", 204))
                            : ResponseEntity.status(HttpStatus.NOT_FOUND)
                                    .body((Object) java.util.Map.of("message", "No encontrado", "status", 404));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body((Object) java.util.Map.of("message", "No encontrado", "status", 404)));
    }

    private ContentType resolveContentTypeFromToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank())
            return null;
        Token token = tokenRepository.findById(tokenId).orElse(null);
        if (token == null)
            return null;
        String accountId = token.getAccountId();
        if (accountId == null)
            return null;
        ContentCreator creator = creatorRepository.findById(accountId).orElse(null);
        if (creator == null)
            return null;
        return creator.getContentType();
    }
}
