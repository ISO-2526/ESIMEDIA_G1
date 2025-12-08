package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadFalse(String userId);

    /**
     * Verifica si existe una notificación de un tipo específico para un usuario y
     * contenido.
     * Usado para sistema anti-spam de alertas de caducidad.
     */
    boolean existsByUserIdAndRelatedContentIdAndNotificationType(
            String userId,
            String relatedContentId,
            String notificationType);
}
