package grupo1.esimedia.service;

import grupo1.esimedia.content.model.NotificationAntiSpam;
import grupo1.esimedia.content.repository.NotificationAntiSpamRepository;
import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.repository.UserNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Servicio unificado para crear notificaciones con anti-spam.
 * Gestiona tanto notificaciones de publicación como de caducidad.
 */
@Service
public class NotificationWithAntiSpamService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationWithAntiSpamService.class);
    
    public static final String TYPE_CONTENT_PUBLISHED = "CONTENT_PUBLISHED";
    public static final String TYPE_CONTENT_EXPIRING = "CONTENT_EXPIRING";

    @Autowired
    private UserNotificationRepository userNotificationRepository;
    
    @Autowired
    private NotificationAntiSpamRepository antiSpamRepository;

    /**
     * Crea una notificación solo si no existe anti-spam.
     * @param userId Email del usuario
     * @param contentId ID del contenido
     * @param title Título de la notificación
     * @param message Mensaje de la notificación
     * @param notificationType Tipo: TYPE_CONTENT_PUBLISHED o TYPE_CONTENT_EXPIRING
     * @return true si se creó la notificación, false si ya existía (anti-spam)
     */
    public boolean createNotificationIfNotExists(String userId, String contentId, 
                                                 String title, String message, 
                                                 String notificationType) {
        // Verificar anti-spam
        if (antiSpamRepository.findByContentIdAndUserIdAndNotificationType(
                contentId, userId, notificationType).isPresent()) {
            return false;
        }
        
        // Determinar tipo de notificación para UserNotification
        String userNotifType = notificationType.equals(TYPE_CONTENT_EXPIRING) ? "WARNING" : "INFO";
        
        // Crear notificación
        UserNotification notification = new UserNotification(userId, title, message, userNotifType);
        notification.setContentId(contentId); // Asignar contentId para navegación directa
        
        try {
            UserNotification saved = userNotificationRepository.save(notification);
            
            // Registrar anti-spam
            NotificationAntiSpam antiSpam = new NotificationAntiSpam(contentId, userId, notificationType);
            antiSpamRepository.save(antiSpam);
            
            return true;
        } catch (Exception e) {
            logger.error("❌ Error al guardar notificación: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Verifica si ya se envió una notificación (consulta anti-spam).
     */
    public boolean wasNotificationSent(String contentId, String userId, String notificationType) {
        return antiSpamRepository.findByContentIdAndUserIdAndNotificationType(
            contentId, userId, notificationType).isPresent();
    }
}
