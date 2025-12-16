package grupo1.esimedia.Accounts.service;

import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.service.UserNotificationService;
import grupo1.esimedia.service.NotificationWithAntiSpamService;
import grupo1.esimedia.Content.model.Content;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de Notificaciones para HDU 492.
 * Gestiona la creación de notificaciones cuando se publica contenido
 * que coincide con las preferencias (tags) de los usuarios.
 */
@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final UserNotificationService userNotificationService;
    private final NotificationWithAntiSpamService notificationWithAntiSpamService;
    private final UserRepository userRepository;
    
    public NotificationService(UserNotificationService userNotificationService,
                               NotificationWithAntiSpamService notificationWithAntiSpamService,
                               UserRepository userRepository) {
        this.userNotificationService = userNotificationService;
        this.notificationWithAntiSpamService = notificationWithAntiSpamService;
        this.userRepository = userRepository;
    }
    
    /**
     * Notifica a usuarios cuyas preferencias coincidan con los tags del contenido.
     * Aplica filtros de seguridad: VIP, edad mínima.
     * 
     * @param content El contenido recién creado/publicado
     */
    public void notifyUsersWithMatchingTags(Content content) {
        if (content == null || content.getTags() == null || content.getTags().isEmpty()) {
            return;
        }
        
        // OPTIMIZACIÓN: Obtener solo usuarios que tengan al menos un tag coincidente
        // En lugar de traer TODOS los usuarios y filtrar en memoria
        List<User> candidateUsers = userRepository.findByTagsIn(content.getTags());
        
        int notificationsCreated = 0;
        for (User user : candidateUsers) {
            // Verificar si el usuario tiene tags (aunque ya deberían tenerlos por la query)
            if (user.getTags() == null || user.getTags().isEmpty()) {
                continue;
            }
            
            // Aplicar todos los filtros de acceso (incluyendo tags coincidentes)
            List<String> matchingTags = canUserAccess(user, content);
            if (matchingTags == null || matchingTags.isEmpty()) {
                continue;
            }
            
            // Crear notificación
            createNotification(user, content, matchingTags);
            notificationsCreated++;
        }
    }
    
    /**
     * Encuentra los tags que coinciden entre usuario y contenido (case-insensitive)
     */
    private List<String> findMatchingTags(List<String> userTags, List<String> contentTags) {
        return userTags.stream()
                .filter(userTag -> contentTags.stream()
                        .anyMatch(contentTag -> contentTag.equalsIgnoreCase(userTag)))
                .collect(Collectors.toList());
    }
    
    /**
     * Verifica si el usuario puede acceder al contenido según filtros de seguridad.
     * Tarea 507: Filtros de seguridad (Rol, Edad, Suscripción VIP, Tags)
     * @return Lista de tags coincidentes si el usuario puede acceder, null o lista vacía si no
     */
    private List<String> canUserAccess(User user, Content content) {
        // Filtro 1: Contenido VIP solo para usuarios VIP
        if (content.isVipOnly() && !user.isVip()) {
            return null;
        }
        
        // Filtro 2: Edad mínima
        if (content.getEdadMinima() != null && content.getEdadMinima() > 0) {
            int userAge = calculateAge(user.getDateOfBirth());
            if (userAge < content.getEdadMinima()) {
                return null;
            }
        }
        
        // Filtro 3: Tags coincidentes
        List<String> matchingTags = findMatchingTags(user.getTags(), content.getTags());
        if (matchingTags.isEmpty()) {
            return null;
        }
        
        // El usuario cumple todos los filtros
        return matchingTags;
    }
    
    /**
     * Calcula la edad del usuario a partir de su fecha de nacimiento
     */
    private int calculateAge(String dateOfBirth) {
        if (dateOfBirth == null || dateOfBirth.trim().isEmpty()) {
            return 0; // Si no tiene fecha, asumir menor de edad por seguridad
        }
        
        try {
            LocalDate birthDate = LocalDate.parse(dateOfBirth);
            return Period.between(birthDate, LocalDate.now()).getYears();
        } catch (DateTimeParseException e) {
            return 0;
        }
    }
    
    /**
     * Crea y guarda una notificación para el usuario con anti-spam
     */
    private void createNotification(User user, Content content, List<String> matchingTags) {
        String tagsStr = String.join(", ", matchingTags);
        String message = String.format(
            "¡Nuevo contenido de '%s' que te puede interesar! Coincide con tus gustos: %s",
            content.getCreatorAlias(),
            tagsStr
        );
        
        // Crear notificación con anti-spam
        notificationWithAntiSpamService.createNotificationIfNotExists(
            user.getEmail(),
            content.getId(),
            "📢 Nuevo contenido disponible",
            message,
            NotificationWithAntiSpamService.TYPE_CONTENT_PUBLISHED
        );
    }
    
    /**
     * Obtiene las notificaciones de un usuario
     */
    public List<UserNotification> getUserNotifications(String userId) {
        return userNotificationService.getNotificationsByUserId(userId);
    }
    
    /**
     * Obtiene las notificaciones no leídas de un usuario
     */
    public List<UserNotification> getUnreadNotifications(String userId) {
        return userNotificationService.getUnreadNotifications(userId);
    }
    
    /**
     * Cuenta las notificaciones no leídas
     */
    public long countUnreadNotifications(String userId) {
        return userNotificationService.getUnreadNotificationCount(userId);
    }
    
    /**
     * Marca una notificación como leída
     */
    public void markAsRead(String notificationId) {
        userNotificationService.markAsRead(notificationId);
    }
    
    /**
     * Marca todas las notificaciones de un usuario como leídas
     */
    public void markAllAsRead(String userId) {
        userNotificationService.markAllAsRead(userId);
    }
}
