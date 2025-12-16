package com.esimedia.accounts.dto.response;

public class TwoFactorSetupResponseDTO {
    private String qrCodeUrl;
    private String secretKey;

    public TwoFactorSetupResponseDTO() {}

    public TwoFactorSetupResponseDTO(String qrCodeUrl, String secretKey) {
        this.qrCodeUrl = qrCodeUrl;
        this.secretKey = secretKey;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }
}
