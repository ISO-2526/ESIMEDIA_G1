package grupo1.esimedia.Content.service;

import grupo1.esimedia.Accounts.model.Notification;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.NotificationRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

/**
 * Servicio para gestionar la caducidad de contenidos.
 * - Tarea 515: Alertas de contenido próximo a caducar (7 días)
 * - Tarea 516: Generación masiva de alertas con filtros
 * - Tarea 517: Expiración de contenidos vencidos
 */
@Service
public class ContentExpirationService {

    private static final Logger log = LoggerFactory.getLogger(ContentExpirationService.class);
    private static final String NOTIFICATION_TYPE_EXPIRING = "EXPIRING_SOON";

    @Autowired
    private CreatorContentRepository contentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Tarea 515: Busca contenidos que caducan exactamente en 7 días
     * y genera alertas para usuarios elegibles.
     */
    public void alertContentExpiringSoon() {
        LocalDate targetDate = LocalDate.now().plusDays(7);
        List<Content> expiringContent = contentRepository.findByAvailableUntil(targetDate);

        log.info("[EXPIRATION] Encontrados {} contenidos que caducan el {}",
                expiringContent.size(), targetDate);

        for (Content content : expiringContent) {
            if (content.getState() != ContentState.PUBLICO) {
                continue; // Solo alertar sobre contenido público
            }
            notifyEligibleUsers(content);
        }
    }

    /**
     * Tarea 516: Genera alertas filtrando usuarios destinatarios
     * con lógica anti-spam (una alerta por contenido/usuario).
     */
    private void notifyEligibleUsers(Content content) {
        List<User> allUsers = userRepository.findAll();
        int notified = 0;

        for (User user : allUsers) {
            // Filtro VIP: no notificar a usuarios no-VIP sobre contenido VIP
            if (content.isVipOnly() && !user.isVip()) {
                continue;
            }

            // Filtro Edad: no notificar a menores sobre contenido restringido
            if (!isUserOldEnough(user, content.getEdadMinima())) {
                continue;
            }

            // Anti-spam: verificar si ya se envió esta alerta
            boolean alreadyNotified = notificationRepository
                    .existsByUserIdAndRelatedContentIdAndNotificationType(
                            user.getEmail(),
                            content.getId(),
                            NOTIFICATION_TYPE_EXPIRING);

            if (alreadyNotified) {
                continue;
            }

            // Crear notificación de alerta
            String message = String.format(
                    "⏰ El contenido '%s' caduca en 7 días. ¡No te lo pierdas!",
                    content.getTitle());

            Notification notification = new Notification(
                    user.getEmail(),
                    message,
                    content.getId(),
                    NOTIFICATION_TYPE_EXPIRING);
            notificationRepository.save(notification);
            notified++;
        }

        log.info("[EXPIRATION] Contenido '{}': {} usuarios notificados",
                content.getTitle(), notified);
    }

    /**
     * Tarea 517: Marca como CADUCADO los contenidos vencidos.
     * Busca contenidos PUBLICO con availableUntil <= HOY.
     */
    public void expireOldContent() {
        LocalDate today = LocalDate.now();
        List<Content> expiredContent = contentRepository
                .findByStateAndAvailableUntilLessThanEqual(ContentState.PUBLICO, today);

        log.info("[EXPIRATION] Encontrados {} contenidos vencidos para caducar",
                expiredContent.size());

        for (Content content : expiredContent) {
            content.setState(ContentState.CADUCADO);
            content.setStateChangedAt(Instant.now());
            contentRepository.save(content);

            log.info("[EXPIRATION] Contenido '{}' (ID: {}) marcado como CADUCADO",
                    content.getTitle(), content.getId());
        }
    }

    /**
     * Helper: Verifica si el usuario tiene edad suficiente para el contenido.
     */
    private boolean isUserOldEnough(User user, Integer edadMinima) {
        if (edadMinima == null || edadMinima == 0) {
            return true;
        }
        if (user.getDateOfBirth() == null) {
            return true; // Fail-safe: si no hay fecha, permitir
        }

        try {
            LocalDate birthDate = LocalDate.parse(user.getDateOfBirth());
            int age = Period.between(birthDate, LocalDate.now()).getYears();
            return age >= edadMinima;
        } catch (Exception e) {
            return true; // Fail-safe en caso de error de parseo
        }
    }
}
