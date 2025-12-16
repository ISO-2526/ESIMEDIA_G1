package grupo1.esimedia.accounts.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("diagonallityllc@gmail.com");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
    public void sendRateLimitExceededEmail(String to) {
        String subject = "Notificación de límite de intentos excedido";
        String body = "Hemos detectado múltiples intentos fallidos de inicio de sesión en su cuenta. " +
                      "Por razones de seguridad, hemos bloqueado temporalmente los intentos adicionales. " +
                      "Si no ha sido usted, le recomendamos cambiar su contraseña.";
        sendEmail(to, subject, body);
    }
}

