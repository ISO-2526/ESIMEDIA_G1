package grupo1.esimedia.Accounts.service;

import grupo1.esimedia.Accounts.model.Notification;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.NotificationRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void createNotification(String userId, String message, String relatedContentId) {
        Notification notification = new Notification(userId, message, relatedContentId);
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void notifyUsersInterestedIn(Content content) {
        List<String> contentTags = content.getTags();
        if (contentTags == null || contentTags.isEmpty()) {
            return;
        }

        List<User> allUsers = userRepository.findAll(); // Optimization: In a real app, use a query with criteria

        for (User user : allUsers) {
            if (user.getPreferences() == null || user.getPreferences().isEmpty()) {
                continue;
            }

            // Check for tag intersection
            boolean match = user.getPreferences().stream()
                    .anyMatch(contentTags::contains);

            if (match) {
                // Check additional filters (e.g. Age, VIP)
                if (content.isVipOnly() && !user.isVip()) {
                    continue;
                }
                if (content.getEdadMinima() != null && user.getDateOfBirth() != null) {
                    // Simple age check (assuming dateOfBirth is YYYY-MM-DD)
                    try {
                        java.time.LocalDate birthDate = java.time.LocalDate.parse(user.getDateOfBirth());
                        int age = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
                        if (age < content.getEdadMinima()) {
                            continue;
                        }
                    } catch (Exception e) {
                        // Ignore date parse errors, skip check or fail safe
                    }
                }

                String message = "Nuevo contenido disponible: " + content.getTitle();
                createNotification(user.getEmail(), message, content.getId());
            }
        }
    }
}
