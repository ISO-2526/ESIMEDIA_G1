package grupo1.esimedia.Accounts.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * DTO para la creación de un nuevo usuario.
 * Contiene solo los campos necesarios para el registro y sus validaciones.
 */
public class CreateUserRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 12, message = "El nombre no puede tener más de 12 caracteres")
    private String name;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 50, message = "Los apellidos no pueden tener más de 50 caracteres")
    private String surname;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email es inválido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 12, max = 128, message = "La contraseña debe tener al menos 12 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>])[A-Za-z\\d!@#$%^&*(),.?\":{}|<>].*$",
            message = "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial")
    private String password;

    private String alias;

    @NotBlank(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate dateOfBirth;

    private boolean vip;

    private String picture;

    // Getters y Setters

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

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public boolean isVip() {
        return vip;
    }

    public void setVip(boolean vip) {
        this.vip = vip;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }
}