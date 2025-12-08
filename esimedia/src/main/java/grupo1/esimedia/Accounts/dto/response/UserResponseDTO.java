package grupo1.esimedia.Accounts.dto.response;

import java.time.LocalDate;

public class UserResponseDTO {
    private String email;
    private String name;
    private String surname;
    private String alias;
    private String picture;
    private boolean vip;
    private LocalDate dateOfBirth;
    private java.util.List<String> preferences;
    // Omitimos password, tokens, etc.

    // Constructor vacío
    public UserResponseDTO() {}

    // Getters y Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public java.util.List<String> getPreferences() { return preferences; }
    public void setPreferences(java.util.List<String> preferences) { this.preferences = preferences; }
}