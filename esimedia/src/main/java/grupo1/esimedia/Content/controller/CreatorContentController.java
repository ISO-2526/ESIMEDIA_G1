package grupo1.esimedia.Content.controller;

import grupo1.esimedia.Accounts.model.ContentType;
import grupo1.esimedia.Content.model.Content;

import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Content.service.ContentService;
import grupo1.esimedia.Content.dto.CreateContentRequestDTO;
import grupo1.esimedia.Content.dto.UpdateContentRequestDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/creator/contents")
@PreAuthorize("hasAnyRole('ADMIN', 'CREATOR')")
public class CreatorContentController {

    private static final String STATUS = "status";
    private static final String MESSAGE = "message";
    private static final String NOENCONTRADO = "No encontrado";


    private final ContentService service;
    private final ContentCreatorRepository creatorRepository;

    public CreatorContentController(ContentService service,
            ContentCreatorRepository creatorRepository) {
        this.service = service;
        this.creatorRepository = creatorRepository;
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
    @PreAuthorize("hasRole('CREATOR')")
    public ResponseEntity<Object> create(
            @Valid @RequestBody CreateContentRequestDTO req) {
        ContentType actorType = resolveContentTypeFromToken();
        try {
            Content saved = service.create(req, actorType);
            return ResponseEntity.created(URI.create("/api/creator/contents/" + saved.getId())).body(saved);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body((Object) Map.of(MESSAGE, ex.getReason(), STATUS, 400));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CREATOR')")
    public ResponseEntity<Object> update(@PathVariable String id,
            @Valid @RequestBody UpdateContentRequestDTO req) {
        ContentType actorType = resolveContentTypeFromToken();
        try {
            var opt = service.update(id, req, actorType);
            if (opt.isPresent()) {
                return ResponseEntity.ok((Object) opt.get());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body((Object) Map.of(MESSAGE, NOENCONTRADO, STATUS, 404));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE, ex.getReason(), STATUS, 400));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CREATOR')")
    public ResponseEntity<Object> delete(@PathVariable String id) {
        ContentType actorContentType = resolveContentTypeFromToken();
        return service.findById(id)
                .map(existing -> {
                    if (actorContentType == null) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) java.util.Map.of(MESSAGE,
                                "Token no proporcionado o inválido", STATUS, 403));
                    }
                    if (!existing.getType().equals(actorContentType)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) java.util.Map.of(MESSAGE,
                                "No estás autorizado para eliminar contenidos de este tipo", STATUS, 403));
                    }
                    boolean deleted = service.delete(id);
                    return deleted
                            ? ResponseEntity.status(HttpStatus.NO_CONTENT)
                                    .body((Object) java.util.Map.of(MESSAGE, "Eliminado", STATUS, 204))
                            : ResponseEntity.status(HttpStatus.NOT_FOUND)
                                    .body((Object) java.util.Map.of(MESSAGE, NOENCONTRADO, STATUS, 404));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body((Object) java.util.Map.of(MESSAGE, NOENCONTRADO, STATUS, 404)));
    }

    private ContentType resolveContentTypeFromToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String accountId = authentication.getName();
        ContentCreator creator = creatorRepository.findById(accountId).orElse(null);
        if (creator == null)
            return null;
        return creator.getContentType();
    }
}