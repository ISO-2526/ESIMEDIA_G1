package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadFalse(String userId);
}
