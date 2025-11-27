package grupo1.esimedia.Accounts.dto.response;

public class ThirdFactorRequiredResponseDTO {
    private boolean thirdFactorRequired;
    private String email;
    private String role;

    public ThirdFactorRequiredResponseDTO() {}

    public ThirdFactorRequiredResponseDTO(String email, String role) {
        this.thirdFactorRequired = true;
        this.email = email;
        this.role = role;
    }

    public boolean isThirdFactorRequired() {
        return thirdFactorRequired;
    }

    public void setThirdFactorRequired(boolean thirdFactorRequired) {
        this.thirdFactorRequired = thirdFactorRequired;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
