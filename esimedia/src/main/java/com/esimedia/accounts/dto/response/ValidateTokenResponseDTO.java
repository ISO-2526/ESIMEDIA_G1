package com.esimedia.accounts.dto.response;

public class ValidateTokenResponseDTO {
    private String role;
    private String email;

    public ValidateTokenResponseDTO() {}

    public ValidateTokenResponseDTO(String role, String email) {
        this.role = role;
        this.email = email;
    }

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
}
