package grupo1.esimedia.accounts.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import grupo1.esimedia.accounts.model.Playlist;
import grupo1.esimedia.accounts.repository.PlaylistRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/playlists")
@PreAuthorize("isAuthenticated()")
public class PlaylistController {

        private static final String ERROR = "error";

    private static final String MESSAGE = "message";

    private final PlaylistRepository playlistRepository;

    public PlaylistController(PlaylistRepository playlistRepository) {
        this.playlistRepository = playlistRepository;
    }

    // Get all playlists for a user
    @GetMapping
    public ResponseEntity<List<Playlist>> getUserPlaylists() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();        if (userEmail == null) return ResponseEntity.status(401).build();
        List<Playlist> playlists = playlistRepository.findByUserEmail(userEmail);
        
        // Log for debugging
        System.out.println("Fetching playlists for user: " + userEmail);
        for (Playlist p : playlists) {
            int itemCount = (p.getItems() != null) ? p.getItems().size() : 0;
            System.out.println("  - Playlist '" + p.getNombre() + "' has " + itemCount + " items");
        }
        
        return ResponseEntity.ok(playlists);
    }

    // Get a specific playlist by ID
    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylistById(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
                if (userEmail == null) return ResponseEntity.status(401).build();
        
        var playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Playlist playlist = playlistOpt.get();
        // Check if user owns this playlist
        if (!playlist.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(playlist);
    }

    // Create a new playlist
    @PostMapping
    public ResponseEntity<?> createPlaylist(@RequestBody Playlist playlist) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();        if (userEmail == null) return ResponseEntity.status(401).build();
        
        // Prevent creating multiple "Favoritos" playlists
        if ("Favoritos".equals(playlist.getNombre())) {
            List<Playlist> existingFavoritos = playlistRepository.findByUserEmail(userEmail)
                .stream()
                .filter(p -> "Favoritos".equals(p.getNombre()) && Boolean.TRUE.equals(p.getIsPermanent()))
                .toList();
            
            if (!existingFavoritos.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(ERROR, "Ya existe una lista de Favoritos"));
            }
        }
        
        playlist.setUserEmail(userEmail);
        playlist.setCreatedAt(LocalDateTime.now());
        playlist.setUpdatedAt(LocalDateTime.now());
        
        // Ensure items list is initialized
        if (playlist.getItems() == null) {
            playlist.setItems(new java.util.ArrayList<>());
        }
        
        Playlist saved = playlistRepository.save(playlist);
        return ResponseEntity.ok(saved);
    }

    // Update playlist (name and description)
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlaylist(
            @PathVariable String id,
            @RequestBody Map<String, String> updates) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        if (userEmail == null) return ResponseEntity.status(401).build();
        
        var playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        // Prevent editing permanent playlists
        if (Boolean.TRUE.equals(playlist.getIsPermanent())) {
            return ResponseEntity.status(403).body(Map.of(ERROR, "No se puede editar la lista de Favoritos"));
        }
        
        if (updates.containsKey("nombre")) {
            playlist.setNombre(updates.get("nombre"));
        }
        if (updates.containsKey("descripcion")) {
            playlist.setDescripcion(updates.get("descripcion"));
        }
        playlist.setUpdatedAt(LocalDateTime.now());
        
        Playlist saved = playlistRepository.save(playlist);
        return ResponseEntity.ok(saved);
    }

    // Delete a playlist
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlaylist(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        if (userEmail == null) return ResponseEntity.status(401).build();
        
        var playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        // Prevent deleting permanent playlists
        if (Boolean.TRUE.equals(playlist.getIsPermanent())) {
            return ResponseEntity.status(403).body(Map.of(ERROR, "No se puede eliminar la lista de Favoritos"));
        }
        
        playlistRepository.deleteById(id);
        return ResponseEntity.ok().body(Map.of(MESSAGE, "Playlist deleted successfully"));
    }

    // Add content to playlist
    @PostMapping("/{id}/content/{contentId}")
    public ResponseEntity<?> addContentToPlaylist(
            @PathVariable String id,
            @PathVariable String contentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        if (userEmail == null) return ResponseEntity.status(401).build();
        
        var playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        // Initialize items list if null
        if (playlist.getItems() == null) {
            playlist.setItems(new java.util.ArrayList<>());
        }
        
        // Check if content already exists in playlist
        boolean exists = playlist.getItems().stream()
                .anyMatch(item -> item.getContentId().equals(contentId));
        
        if (exists) {
            return ResponseEntity.status(400).body(Map.of(ERROR, "Content already in playlist"));
        }
        
        // Add content to playlist
        Playlist.PlaylistItem item = new Playlist.PlaylistItem(contentId);
        playlist.getItems().add(item);
        playlist.setUpdatedAt(LocalDateTime.now());
        
        Playlist savedPlaylist = playlistRepository.save(playlist);
        
        // Log for debugging
        System.out.println("Playlist saved with " + savedPlaylist.getItems().size() + " items");
        
        return ResponseEntity.ok(savedPlaylist);
    }

    // Remove content from playlist
    @DeleteMapping("/{id}/content/{contentId}")
    public ResponseEntity<?> removeContentFromPlaylist(
            @PathVariable String id,
            @PathVariable String contentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        if (userEmail == null) return ResponseEntity.status(401).build();
        
        var playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build();
        }
        
        // Remove content from playlist
        playlist.getItems().removeIf(item -> item.getContentId().equals(contentId));
        playlist.setUpdatedAt(LocalDateTime.now());
        
        playlistRepository.save(playlist);
        return ResponseEntity.ok(playlist);
    }
}