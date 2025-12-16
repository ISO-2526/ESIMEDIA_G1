package com.esimedia.accounts.dto.response;

public class TwoFactorRequiredResponseDTO {
    private boolean requiresTwoFactor;
    private String email;
    private String role;

    public TwoFactorRequiredResponseDTO() {}

    public TwoFactorRequiredResponseDTO(String email, String role) {
        this.requiresTwoFactor = true;
        this.email = email;
        this.role = role;
    }

    public boolean isRequiresTwoFactor() {
        return requiresTwoFactor;
    }

    public void setRequiresTwoFactor(boolean requiresTwoFactor) {
        this.requiresTwoFactor = requiresTwoFactor;
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
