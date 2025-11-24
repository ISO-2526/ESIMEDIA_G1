package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.model.Playlist;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.PlaylistRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/creator/playlists")
@CrossOrigin(origins = "http://localhost:3000")
public class CreatorPlaylistController {

    private static final String OWNER_TYPE_CREATOR = "CREATOR";
    private static final String ERROR = "error";
    private static final String UNKNOWN_CREATOR = "Creador desconocido";

    private final PlaylistRepository playlistRepository;
    private final ContentCreatorRepository contentCreatorRepository;
    private final TokenRepository tokenRepository;

    public CreatorPlaylistController(PlaylistRepository playlistRepository, ContentCreatorRepository contentCreatorRepository, TokenRepository tokenRepository) {
        this.playlistRepository = playlistRepository;
        this.contentCreatorRepository = contentCreatorRepository;
        this.tokenRepository = tokenRepository;
    }

    private Optional<String> getEmailFromToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return Optional.empty();
        Optional<Token> tokenOpt = tokenRepository.findById(tokenId);
        if (tokenOpt.isEmpty()) return Optional.empty();
        Token token = tokenOpt.get();
        if (token.getExpiration() != null && token.getExpiration().isBefore(LocalDateTime.now())) return Optional.empty();
        return Optional.ofNullable(token.getAccountId());
    }

    private Optional<String> getCreatorAlias(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        Optional<ContentCreator> creator = contentCreatorRepository.findById(email);
        if (creator.isEmpty()) {
            creator = contentCreatorRepository.findByEmail(email);
        }
        return creator.map(ContentCreator::getAlias);
    }

    @GetMapping
    public ResponseEntity<List<Playlist>> myCreatorPlaylists(@CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        String email = emailOpt.get();
        List<Playlist> lists = playlistRepository.findByOwnerTypeAndUserEmail(OWNER_TYPE_CREATOR, email);
        
        String alias = getCreatorAlias(email).orElse(UNKNOWN_CREATOR);
        for (Playlist playlist : lists) {
            playlist.setCreatorAlias(alias);
        }
        
        return ResponseEntity.ok(lists);
    }

    @GetMapping("/all")
    public ResponseEntity<Object> allCreatorPlaylists(@CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        
        List<Playlist> lists = playlistRepository.findByOwnerType(OWNER_TYPE_CREATOR);
        
        for (Playlist playlist : lists) {
            String alias = getCreatorAlias(playlist.getUserEmail()).orElse(UNKNOWN_CREATOR);
            playlist.setCreatorAlias(alias);
        }
        
        return ResponseEntity.ok(lists);
    }


    @GetMapping("/public")
    public ResponseEntity<Object> publicVisibleCreatorPlaylists() {
        List<Playlist> lists = playlistRepository.findByOwnerTypeAndVisibleIsTrue(OWNER_TYPE_CREATOR);
        
        for (Playlist playlist : lists) {
            String alias = getCreatorAlias(playlist.getUserEmail()).orElse(UNKNOWN_CREATOR);
            playlist.setCreatorAlias(alias);
        }
        
        return ResponseEntity.ok(lists);
    }

    // Crear lista del creador
    @PostMapping
    public ResponseEntity<Object> createCreatorPlaylist(@RequestBody Map<String, Object> body, @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        String email = emailOpt.get();

        String nombre = Optional.ofNullable((String) body.get("nombre"))
                .map(String::trim).orElse("");
        String descripcion = (String) body.getOrDefault("descripcion", null);
        Boolean visible = (Boolean) body.getOrDefault("visible", Boolean.TRUE);
        @SuppressWarnings("unchecked")
        List<String> contentIds = (List<String>) body.get("contentIds");

        if (nombre.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, "NOMBRE_REQUERIDO"));
        }
        
        // Unicidad de nombre global entre creadores (case-insensitive)
        if (playlistRepository.existsByOwnerTypeAndNombreIgnoreCase(OWNER_TYPE_CREATOR, nombre)) {
            return ResponseEntity.status(409).body(Map.of(ERROR, "LIST_NAME_ALREADY_EXISTS"));
        }

        Playlist p = new Playlist();
        p.setUserEmail(email);
        p.setOwnerType(OWNER_TYPE_CREATOR);
        p.setIsPublic(Boolean.TRUE);
        p.setVisible(visible != null ? visible : Boolean.TRUE);
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());

        List<Playlist.PlaylistItem> items = new ArrayList<>();
        if (contentIds != null && !contentIds.isEmpty()) {
            List<String> uniqueIds = new ArrayList<>(new LinkedHashSet<>(contentIds));
            for (String cid : uniqueIds) {
                items.add(new Playlist.PlaylistItem(cid));
            }
        }
        p.setItems(items);

        Playlist saved = playlistRepository.save(p);
        return ResponseEntity.status(201).body(saved);
    }

    // Obtener una lista del creador por ID 
    @GetMapping("/{id}")
    public ResponseEntity<Object> getCreatorPlaylist(@PathVariable String id, @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();

        var opt = playlistRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        Playlist pl = opt.get();
        if (!OWNER_TYPE_CREATOR.equals(pl.getOwnerType())) return ResponseEntity.status(404).build();
        
        String alias = getCreatorAlias(pl.getUserEmail()).orElse(UNKNOWN_CREATOR);
        pl.setCreatorAlias(alias);
        
        return ResponseEntity.ok(pl);
    }

    // Actualizar nombre/descripcion/visibilidad (valida unicidad de nombre)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCreatorPlaylist(@PathVariable String id,
                                                   @RequestBody Map<String, Object> body,
                                                   @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        var opt = playlistRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        Playlist p = opt.get();
        if (!OWNER_TYPE_CREATOR.equals(p.getOwnerType())) return ResponseEntity.status(404).build();

        String nuevoNombre = Optional.ofNullable((String) body.get("nombre")).map(String::trim).orElse(null);
        String nuevaDesc = (String) body.getOrDefault("descripcion", null);
        Boolean nuevoVisible = (Boolean) body.get("visible");

        if (nuevoNombre != null && !nuevoNombre.isEmpty() && !nuevoNombre.equalsIgnoreCase(p.getNombre())) {
            if (playlistRepository.existsByOwnerTypeAndNombreIgnoreCaseAndIdNot(OWNER_TYPE_CREATOR, nuevoNombre, id)) {
                return ResponseEntity.status(409).body(Map.of(ERROR, "LIST_NAME_ALREADY_EXISTS"));
            }
            p.setNombre(nuevoNombre);
        }
        if (nuevaDesc != null) p.setDescripcion(nuevaDesc);
        if (nuevoVisible != null) p.setVisible(nuevoVisible);

        p.setUpdatedAt(LocalDateTime.now());
        Playlist saved = playlistRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    // Añadir contenido 
    @PostMapping("/{id}/content/{contentId}")
    public ResponseEntity<Object> addContent(@PathVariable String id,
                                        @PathVariable String contentId,
                                        @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        var opt = playlistRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        Playlist p = opt.get();
        if (!OWNER_TYPE_CREATOR.equals(p.getOwnerType())) return ResponseEntity.status(404).build();

        if (p.getItems() == null) p.setItems(new ArrayList<>());
        boolean exists = p.getItems().stream().anyMatch(i -> Objects.equals(i.getContentId(), contentId));
        if (exists) return ResponseEntity.status(409).body(Map.of(ERROR, "DUPLICATE_ITEM"));

        p.getItems().add(new Playlist.PlaylistItem(contentId));
        p.setUpdatedAt(LocalDateTime.now());
        Playlist saved = playlistRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    // Eliminar contenido 
    @DeleteMapping("/{id}/content/{contentId}")
    public ResponseEntity<Object> removeContent(@PathVariable String id,
                                           @PathVariable String contentId,
                                           @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        var opt = playlistRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        Playlist p = opt.get();
        if (!OWNER_TYPE_CREATOR.equals(p.getOwnerType())) return ResponseEntity.status(404).build();

        if (p.getItems() == null || p.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, "LIST_ALREADY_EMPTY"));
        }
        if (p.getItems().size() <= 1) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, "CANNOT_REMOVE_LAST_ITEM"));
        }
        p.getItems().removeIf(i -> Objects.equals(i.getContentId(), contentId));
        p.setUpdatedAt(LocalDateTime.now());
        Playlist saved = playlistRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    // Eliminar una lista del creador
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteCreatorPlaylist(@PathVariable String id, @CookieValue(value = "access_token", required = false) String tokenId) {
        var emailOpt = getEmailFromToken(tokenId);
        if (emailOpt.isEmpty()) return ResponseEntity.status(401).build();
        var opt = playlistRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        Playlist p = opt.get();
        if (!OWNER_TYPE_CREATOR.equals(p.getOwnerType())) return ResponseEntity.status(404).build();

        playlistRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Playlist deleted successfully"));
    }
}