package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositorio de Notificaciones para HDU 492.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    /**
     * Obtiene todas las notificaciones de un usuario ordenadas por fecha (más recientes primero)
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Obtiene las notificaciones no leídas de un usuario
     */
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);
    
    /**
     * Cuenta las notificaciones no leídas de un usuario
     */
    long countByUserIdAndReadFalse(String userId);
}
