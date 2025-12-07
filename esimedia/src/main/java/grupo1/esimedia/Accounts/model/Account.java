package grupo1.esimedia.Accounts.model;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private List<String> passwordHistory = new ArrayList<>();
    public List<String> getPasswordHistory() {
        return passwordHistory;
    }
    public void addPasswordToHistory(String newHashedPassword) {
        if (this.passwordHistory == null) {
            this.passwordHistory = new ArrayList<>(); // <-- Sé consistente
        }
        
        // Añadir el nuevo hash al principio (índice 0)
        // Esto funciona en CUALQUIER tipo de List
        this.passwordHistory.add(0, newHashedPassword);
        
        // Mantener solo las últimas 5 contraseñas
        while (this.passwordHistory.size() > 5) {
            // Eliminar el último elemento (índice size - 1)
            // Esto también funciona en CUALQUIER tipo de List
            this.passwordHistory.remove(this.passwordHistory.size() - 1);
        }
    }

    /** Timestamp del último cambio de contraseña. */
    private Instant lastPasswordChangeAt;
    public Instant getLastPasswordChangeAt() {
        return lastPasswordChangeAt;
    }
    public void setLastPasswordChangeAt(Instant lastPasswordChangeAt) {
        this.lastPasswordChangeAt = lastPasswordChangeAt;
    }
}
