package com.esimedia.accounts.dto.response;

import java.util.Map;

public class LoginResponse {
    private boolean success;
    private String message;
    private String token;
    private String role;
    private String email;
    private String picture;
    private String alias;
    private Boolean thirdFactorEnabled;
    private Boolean thirdFactorRequired;
    private Integer remainingAttempts;
    private Long lockedUntilSeconds;
    
    public LoginResponse() {}
    
    public LoginResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public static LoginResponse success(Map<String, Object> data) {
        LoginResponse response = new LoginResponse(true, "Login exitoso");
        response.setToken((String) data.get("token"));
        response.setRole((String) data.get("role"));
        response.setEmail((String) data.get("email"));
        response.setPicture((String) data.get("picture"));
        response.setAlias((String) data.get("alias"));
        response.setThirdFactorEnabled((Boolean) data.get("thirdFactorEnabled"));
        return response;
    }
    
    public static LoginResponse failure(String message, Integer remainingAttempts) {
        LoginResponse response = new LoginResponse(false, message);
        response.setRemainingAttempts(remainingAttempts);
        return response;
    }
    
    public static LoginResponse locked(String message, Long lockedUntilSeconds) {
        LoginResponse response = new LoginResponse(false, message);
        response.setLockedUntilSeconds(lockedUntilSeconds);
        return response;
    }
    
    public static LoginResponse thirdFactorRequired(String email, String role) {
        LoginResponse response = new LoginResponse(false, "Tercer factor requerido");
        response.setThirdFactorRequired(true);
        response.setEmail(email);
        response.setRole(role);
        return response;
    }
    
    // Getters y Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    
    public Boolean getThirdFactorEnabled() { return thirdFactorEnabled; }
    public void setThirdFactorEnabled(Boolean thirdFactorEnabled) { this.thirdFactorEnabled = thirdFactorEnabled; }
    
    public Boolean getThirdFactorRequired() { return thirdFactorRequired; }
    public void setThirdFactorRequired(Boolean thirdFactorRequired) { this.thirdFactorRequired = thirdFactorRequired; }
    
    public Integer getRemainingAttempts() { return remainingAttempts; }
    public void setRemainingAttempts(Integer remainingAttempts) { this.remainingAttempts = remainingAttempts; }
    
    public Long getLockedUntilSeconds() { return lockedUntilSeconds; }
    public void setLockedUntilSeconds(Long lockedUntilSeconds) { this.lockedUntilSeconds = lockedUntilSeconds; }
}