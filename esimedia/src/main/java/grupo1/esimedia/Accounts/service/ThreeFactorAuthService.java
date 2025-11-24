package grupo1.esimedia.Accounts.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import grupo1.esimedia.Accounts.model.EmailVerificationCode;
import grupo1.esimedia.Accounts.repository.VerificationCodeRepository;

@Service
public class ThreeFactorAuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    public String generateVerificationCode(String email) {
        String code = String.format("%06d", SECURE_RANDOM.nextInt(999999)); // Código de 6 dígitos
        verificationCodeRepository.deleteByEmail(email); // Eliminar códigos anteriores

        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpiration(LocalDateTime.now().plusMinutes(15)); // Código válido por 10 minutos

        verificationCodeRepository.save(verificationCode);
        return code;
    }

    /**
     * Valida el código de verificación introducido por el usuario.
     *
     * @param email El correo electrónico del usuario.
     * @param code  El código de verificación introducido.
     * @return true si el código es válido, false en caso contrario.
     */
    public boolean validateVerificationCode(String email, String code) {
        EmailVerificationCode verificationCode = verificationCodeRepository.findByEmail(email).orElse(null);

        if (verificationCode == null || verificationCode.getExpiration().isBefore(LocalDateTime.now())) {
            return false; // Código inválido o expirado
        }

        boolean isValid = verificationCode.getCode().equals(code);
        if (isValid) {
            verificationCodeRepository.deleteByEmail(email); // Eliminar el código después de la validación
        }
        return isValid;
    }
}