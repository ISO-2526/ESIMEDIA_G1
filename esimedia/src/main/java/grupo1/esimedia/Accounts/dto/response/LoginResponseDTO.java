package grupo1.esimedia.Accounts.dto.response;

public class LoginResponseDTO {
    private String role;
    private String email;
    private String alias;
    private String picture;
    private boolean thirdFactorEnabled;

    public LoginResponseDTO() {}

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public boolean isThirdFactorEnabled() {
        return thirdFactorEnabled;
    }

    public void setThirdFactorEnabled(boolean thirdFactorEnabled) {
        this.thirdFactorEnabled = thirdFactorEnabled;
    }
}
