package grupo1.esimedia.Content.service;

import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para gestionar la caducidad de contenidos (HDU 493)
 * 
 * Funcionalidades:
 * - Task 515: Alertar sobre contenidos que caducan en 7 días
 * - Task 516: Generar alertas masivas con filtros (Premium/Edad) y anti-spam
 * - Task 517: Ocultar contenidos vencidos (cambiar a PRIVADO)
 */
@Service
public class ContentExpirationService {
    

    private static final int DAYS_BEFORE_EXPIRATION = 7;
    
    @Autowired
    private CreatorContentRepository contentRepository;
    
    @Autowired
    private UserRepository userRepository;
    

    
    @Autowired
    private grupo1.esimedia.service.NotificationWithAntiSpamService notificationWithAntiSpamService;
    
    /**
     * Task 515 y 516: Busca contenidos que caducan en exactamente 7 días
     * y genera alertas para usuarios con acceso.
     */
    public void checkAndAlertExpiringContent() {
        LocalDate expirationDate = LocalDate.now().plusDays(DAYS_BEFORE_EXPIRATION);
        
        // Buscar contenidos públicos que caducan exactamente en 7 días
        List<Content> expiringContent = contentRepository.findByAvailableUntilAndState(
            expirationDate, ContentState.PUBLICO);
        
        int alertsSent = 0;
        for (Content content : expiringContent) {
            alertsSent += alertUsersAboutExpiring(content);
        }
    }
    
    /**
     * Task 517: Busca contenidos con fecha de caducidad <= hoy
     * y los oculta (cambia estado a PRIVADO)
     */
    public void processExpiredContent() {
        LocalDate today = LocalDate.now();
        
        // Buscar contenidos públicos con fecha de caducidad pasada o igual a hoy
        List<Content> expiredContent = contentRepository.findByAvailableUntilBeforeAndState(
            today.plusDays(1), ContentState.PUBLICO); // plusDays(1) para incluir hoy
        
        int hidden = 0;
        for (Content content : expiredContent) {
            // Solo procesar si realmente está vencido (availableUntil <= hoy)
            if (content.getAvailableUntil() != null && 
                !content.getAvailableUntil().isAfter(today)) {
                
                content.setState(ContentState.PRIVADO);
                content.setStateChangedAt(Instant.now());
                contentRepository.save(content);
                hidden++;
            }
        }
    }
    
    /**
     * Task 516: Genera alertas para usuarios con acceso al contenido.
     * Aplica filtros de Premium y Edad.
     * Implementa anti-spam: solo 1 alerta por contenido/usuario.
     */
    private int alertUsersAboutExpiring(Content content) {
        // OPTIMIZACIÓN: Obtener solo usuarios que tengan al menos un tag coincidente
        // En lugar de traer TODOS los usuarios y filtrar en memoria
        if (content.getTags() == null || content.getTags().isEmpty()) {
            return 0; // Sin tags, no se puede filtrar usuarios relevantes
        }
        
        List<User> candidateUsers = userRepository.findByTagsIn(content.getTags());
        int alertCount = 0;
        
        for (User user : candidateUsers) {
            // Aplicar filtros de acceso (VIP y Edad)
            if (!canUserAccessContent(user, content)) {
                continue;
            }
            
            // Crear notificación con anti-spam
            boolean created = notificationWithAntiSpamService.createNotificationIfNotExists(
                user.getEmail(),
                content.getId(),
                "⏰ Contenido próximo a caducar",
                String.format("El contenido '%s' caducará en %d días. ¡No te lo pierdas!",
                    content.getTitle(), DAYS_BEFORE_EXPIRATION),
                grupo1.esimedia.service.NotificationWithAntiSpamService.TYPE_CONTENT_EXPIRING
            );
            
            if (created) {
                alertCount++;
            }
        }
        
        return alertCount;
    }
    
    /**
     * Verifica si el usuario puede acceder al contenido.
     * Filtros: VIP (Premium) y Edad mínima.
     */
    private boolean canUserAccessContent(User user, Content content) {
        // Filtro 1: Contenido VIP solo para usuarios VIP
        if (content.isVipOnly() && !user.isVip()) {
            return false; // Denegar acceso
        }
        
        // Filtro 2: Edad mínima
        if (content.getEdadMinima() != null && content.getEdadMinima() > 0) {
            int userAge = calculateAge(user.getDateOfBirth());
            if (userAge < content.getEdadMinima()) {
                return false; // Denegar si es menor de edad
            }
        }
        
        // Filtro 3: Tags coincidentes (Refactorizado con Streams)
        // La lógica original requiere que el usuario tenga tags Y que al menos uno coincida
        List<String> userTags = Optional.ofNullable(user.getTags()).orElse(Collections.emptyList());
        List<String> contentTags = Optional.ofNullable(content.getTags()).orElse(Collections.emptyList());

        // Si el usuario no tiene tags, la lógica original deniega el acceso.
        if (userTags.isEmpty()) {
            return false; 
        }

        // Usamos Streams para encontrar cualquier coincidencia (más eficiente que bucles anidados)
        boolean hasMatchingTag = contentTags.stream()
            .anyMatch(contentTag -> userTags.stream()
                .anyMatch(userTag -> contentTag.equalsIgnoreCase(userTag)));
        
        if (!hasMatchingTag) {
            return false; // Denegar si no hay tags coincidentes
        }
        
        // Si ha pasado todos los filtros, es accesible.
        return true;
    }
    
    /**
     * Calcula la edad del usuario
     */
    private int calculateAge(String dateOfBirth) {
        if (dateOfBirth == null || dateOfBirth.isEmpty()) {
            return 0;
        }
        try {
            LocalDate birthDate = LocalDate.parse(dateOfBirth);
            return Period.between(birthDate, LocalDate.now()).getYears();
        } catch (Exception e) {
            return 0;
        }
    }
}
