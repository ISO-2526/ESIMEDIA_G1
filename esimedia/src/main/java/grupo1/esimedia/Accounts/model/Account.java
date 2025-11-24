package grupo1.esimedia.Accounts.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import org.springframework.data.annotation.Id;
import jakarta.validation.constraints.*;

@MappedSuperclass
public abstract class Account {

    @NotNull
    @Size(max = 15)
    @Column(length = 15, nullable = false)
    private String name;

    @NotNull
    @Size(max = 15)
    @Column(length = 15, nullable = false)
    private String surname;

    @Id
    @Email
    @Column(nullable = false, unique = true, updatable = false)
    private String email;

    @NotNull
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private boolean isActive = true; 

    @Column(nullable = false, updatable = false)
    @Convert(converter = LocalDateTimeAttributeConverter.class)
    private LocalDateTime createdAt;

    private String twoFactorSecretKey;

    private boolean isThirdFactorEnabled = false;

    private String resetToken;

    private LocalDateTime tokenExpiration;

        public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public LocalDateTime getTokenExpiration() { return tokenExpiration; }
    public void setTokenExpiration(LocalDateTime tokenExpiration) { this.tokenExpiration = tokenExpiration; }

    public boolean isThirdFactorEnabled() {
        return isThirdFactorEnabled;
    }
    
    public void setThirdFactorEnabled(boolean isThirdFactorEnabled) {
        this.isThirdFactorEnabled = isThirdFactorEnabled;
    }

    public String getTwoFactorSecretKey() {
        return twoFactorSecretKey;
    }

    public void setTwoFactorSecretKey(String twoFactorSecretKey) {
        this.twoFactorSecretKey = twoFactorSecretKey;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
