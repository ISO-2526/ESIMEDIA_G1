package grupo1.esimedia.Accounts.dto.request;

import jakarta.validation.constraints.Size;

public class UpdateUserRequestDTO {
    @Size(max = 12, message = "El nombre no puede tener más de 12 caracteres")
    private String name;
    
    @Size(max = 50, message = "Los apellidos no pueden tener más de 50 caracteres")
    private String surname;
    
    private String alias;
    private String picture;
    private Boolean active;
    
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
}