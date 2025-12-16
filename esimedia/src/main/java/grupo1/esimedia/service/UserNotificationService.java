package grupo1.esimedia.service;

import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.repository.UserNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Servicio de negocio para gestionar notificaciones de usuarios.
 */
@Service
public class UserNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(UserNotificationService.class);

    @Autowired
    private UserNotificationRepository userNotificationRepository;

    /**
     * Obtiene todas las notificaciones de un usuario ordenadas por fecha descendente.
     * @param userId ID del usuario
     * @return Lista de notificaciones
     */
    public List<UserNotification> getNotificationsByUserId(String userId) {
        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Obtiene todas las notificaciones no leídas de un usuario.
     * @param userId ID del usuario
     * @return Lista de notificaciones no leídas
     */
    public List<UserNotification> getUnreadNotifications(String userId) {
        return userNotificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Obtiene una notificación específica por ID.
     * @param notificationId ID de la notificación
     * @return Optional con la notificación
     */
    public Optional<UserNotification> getNotificationById(String notificationId) {
        return userNotificationRepository.findById(notificationId);
    }

    /**
     * Crea una nueva notificación.
     * @param userNotification La notificación a crear
     * @return La notificación creada
     */
    public UserNotification createNotification(UserNotification userNotification) {
        logger.info("🔵 [UserNotificationService] Guardando notificación:");
        logger.info("   - UserId: {}", userNotification.getUserId());
        logger.info("   - Title: {}", userNotification.getTitle());
        logger.info("   - Type: {}", userNotification.getType());
        logger.info("   - CreatedAt: {}", userNotification.getCreatedAt());
        
        try {
            UserNotification saved = userNotificationRepository.save(userNotification);
            logger.info("🟢 [UserNotificationService] Notificación guardada exitosamente con ID: {}", saved.getId());
            
            // Verificación inmediata
            long count = userNotificationRepository.count();
            logger.info("📊 Total de notificaciones en DB: {}", count);
            
            return saved;
        } catch (Exception e) {
            logger.error("🔴 [UserNotificationService] Error al guardar notificación: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Marca una notificación como leída.
     * @param notificationId ID de la notificación
     * @return La notificación actualizada
     */
    public Optional<UserNotification> markAsRead(String notificationId) {
        Optional<UserNotification> notification = userNotificationRepository.findById(notificationId);
        if (notification.isPresent()) {
            UserNotification n = notification.get();
            n.setRead(true);
            n.setReadAt(java.time.LocalDateTime.now());
            userNotificationRepository.save(n);
        }
        return notification;
    }

    /**
     * Marca todas las notificaciones de un usuario como leídas.
     * @param userId ID del usuario
     */
    public void markAllAsRead(String userId) {
        List<UserNotification> unreadNotifications = userNotificationRepository.findByUserIdAndReadFalse(userId);
        for (UserNotification notification : unreadNotifications) {
            notification.setRead(true);
            notification.setReadAt(java.time.LocalDateTime.now());
            userNotificationRepository.save(notification);
        }
    }

    /**
     * Elimina una notificación específica.
     * @param notificationId ID de la notificación
     */
    public void deleteNotification(String notificationId) {
        userNotificationRepository.deleteById(notificationId);
    }

    /**
     * Elimina todas las notificaciones de un usuario.
     * @param userId ID del usuario
     */
    public void deleteAllNotificationsByUserId(String userId) {
        userNotificationRepository.deleteByUserId(userId);
    }

    /**
     * Obtiene el número de notificaciones no leídas de un usuario.
     * @param userId ID del usuario
     * @return Número de notificaciones no leídas
     */
    public long getUnreadNotificationCount(String userId) {
        return userNotificationRepository.countByUserIdAndReadFalse(userId);
    }
}
