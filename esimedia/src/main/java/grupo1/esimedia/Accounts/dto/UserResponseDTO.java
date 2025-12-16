package grupo1.esimedia.accounts.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserResponseDTO {
    private String email;
    private String name;
    private String surname;
    private String alias;
    private String picture;
    private Boolean active;
    private boolean vip;
    private LocalDateTime vipSince;
    private List<String> favorites;
    private List<String> tags; // Preferencias del usuario
    
    public UserResponseDTO() {}

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getSurname() {
        return surname;
    }
    public void setSurname(String surname) {
        this.surname = surname;
    }
    public String getAlias() {
        return alias;
    }
    public void setAlias(String alias) {
        this.alias = alias;
    }
    public String getPicture() {
        return picture;
    }
    public void setPicture(String picture) {
        this.picture = picture;
    }
    public Boolean getActive() {
        return active;
    }
    public void setActive(Boolean active) {
        this.active = active;
    }
    public boolean isVip() {
        return vip;
    }
    public void setVip(boolean vip) {
        this.vip = vip;
    }
    public LocalDateTime getVipSince() {
        return vipSince;
    }
    public void setVipSince(LocalDateTime vipSince) {
        this.vipSince = vipSince;
    }
    public List<String> getFavorites() {
        return favorites;
    }
    public void setFavorites(List<String> favorites) {
        this.favorites = favorites;
    }
    public List<String> getTags() {
        return tags;
    }
    public void setTags(List<String> tags) {
        this.tags = tags;
    }
    
}
