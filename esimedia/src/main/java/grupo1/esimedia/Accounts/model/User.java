package grupo1.esimedia.accounts.model;

import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "users")
public class User extends Account {

    private String alias;
    private String picture;
    private boolean vip;
    private LocalDateTime vipSince;
    private List<String> favorites; // List of content IDs marked as favorites
    private String dateOfBirth;
    private List<String> tags; // Preferencias del usuario (ej: "rock", "jazz", "podcast")


    // Getters y setters
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }
    public LocalDateTime getVipSince() { return vipSince; }
    public void setVipSince(LocalDateTime vipSince) { this.vipSince = vipSince; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public List<String> getFavorites() { return favorites; }
    public void setFavorites(List<String> favorites) { this.favorites = favorites; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

}
