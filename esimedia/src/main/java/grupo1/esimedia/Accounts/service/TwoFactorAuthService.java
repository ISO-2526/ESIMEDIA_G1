package grupo1.esimedia.accounts.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorAuthService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    // Generar clave secreta para un usuario
    public String generateSecretKey() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    // Validar el código OTP proporcionado por el usuario
    public boolean validateCode(String secretKey, int code) {
        return gAuth.authorize(secretKey, code);
    }
}