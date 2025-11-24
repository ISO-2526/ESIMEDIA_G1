package grupo1.esimedia.Accounts.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "playlists")
public class Playlist {

    @Id
    private String id;
    
    @Field("nombre")
    private String nombre;
    
    @Field("descripcion")
    private String descripcion;
    
    @Field("userEmail")
    private String userEmail; // Owner of the playlist
    
    @Field("creatorAlias")
    private String creatorAlias; // Alias of creator
    
    @Field("ownerType")
    private String ownerType; // "USER" or "CREATOR"
    
    @Field("isPublic")
    private Boolean isPublic; // true for creator playlists, false for user playlists
    
    @Field("visible")
    private Boolean visible; // Visibility toggle for creator playlists
    
    @Field("isPermanent")
    private Boolean isPermanent; // true for system playlists like "Favoritos"
    
    @Field("items")
    private List<PlaylistItem> items; // List of content IDs with metadata
    
    @Field("createdAt")
    private LocalDateTime createdAt;
    
    @Field("updatedAt")
    private LocalDateTime updatedAt;

    public Playlist() {
        this.items = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.ownerType = "USER"; // Default to user playlist
        this.isPublic = false;
        this.visible = true;
        this.isPermanent = false;
    }

    // Inner class to store content with addition date
    public static class PlaylistItem {
        @Field("contentId")
        private String contentId;
        
        @Field("addedAt")
        private LocalDateTime addedAt;

        public PlaylistItem() {
            this.addedAt = LocalDateTime.now();
        }

        public PlaylistItem(String contentId) {
            this.contentId = contentId;
            this.addedAt = LocalDateTime.now();
        }

        public String getContentId() { return contentId; }
        public void setContentId(String contentId) { this.contentId = contentId; }

        public LocalDateTime getAddedAt() { return addedAt; }
        public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getCreatorAlias() { return creatorAlias; }
    public void setCreatorAlias(String creatorAlias) { this.creatorAlias = creatorAlias; }

    public List<PlaylistItem> getItems() { return items; }
    public void setItems(List<PlaylistItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String ownerType) { this.ownerType = ownerType; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    
    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }
    
    public Boolean getIsPermanent() { return isPermanent; }
    public void setIsPermanent(Boolean isPermanent) { this.isPermanent = isPermanent; }
}
