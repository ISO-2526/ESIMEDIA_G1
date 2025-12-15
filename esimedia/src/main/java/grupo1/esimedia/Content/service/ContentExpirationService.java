package grupo1.esimedia.Content.service;

import grupo1.esimedia.Accounts.model.Notification;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.NotificationRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.model.ExpirationAlert;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import grupo1.esimedia.Content.repository.ExpirationAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

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
    
    private static final Logger logger = LoggerFactory.getLogger(ContentExpirationService.class);
    private static final String ALERT_TYPE_EXPIRING_SOON = "EXPIRING_SOON";
    private static final String ALERT_TYPE_EXPIRED = "EXPIRED";
    private static final int DAYS_BEFORE_EXPIRATION = 7;
    
    @Autowired
    private CreatorContentRepository contentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private ExpirationAlertRepository expirationAlertRepository;
    
    /**
     * Task 515 y 516: Busca contenidos que caducan en exactamente 7 días
     * y genera alertas para usuarios con acceso.
     */
    public void checkAndAlertExpiringContent() {
        LocalDate expirationDate = LocalDate.now().plusDays(DAYS_BEFORE_EXPIRATION);
        logger.info("═══════════════════════════════════════════════════════");
        logger.info("HDU 493 - Buscando contenidos que caducan el: {}", expirationDate);
        
        // Buscar contenidos públicos que caducan exactamente en 7 días
        List<Content> expiringContent = contentRepository.findByAvailableUntilAndState(
            expirationDate, ContentState.PUBLICO);
        
        logger.info("Encontrados {} contenidos que caducan en {} días", 
            expiringContent.size(), DAYS_BEFORE_EXPIRATION);
        
        int alertsSent = 0;
        for (Content content : expiringContent) {
            alertsSent += alertUsersAboutExpiring(content);
        }
        
        logger.info("Total alertas enviadas: {}", alertsSent);
        logger.info("═══════════════════════════════════════════════════════");
    }
    
    /**
     * Task 517: Busca contenidos con fecha de caducidad <= hoy
     * y los oculta (cambia estado a PRIVADO)
     */
    public void processExpiredContent() {
        LocalDate today = LocalDate.now();
        logger.info("═══════════════════════════════════════════════════════");
        logger.info("HDU 493 - Procesando contenidos vencidos (fecha <= {})", today);
        
        // Buscar contenidos públicos con fecha de caducidad pasada o igual a hoy
        List<Content> expiredContent = contentRepository.findByAvailableUntilBeforeAndState(
            today.plusDays(1), ContentState.PUBLICO); // plusDays(1) para incluir hoy
        
        logger.info("Encontrados {} contenidos vencidos", expiredContent.size());
        
        int hidden = 0;
        for (Content content : expiredContent) {
            // Solo procesar si realmente está vencido (availableUntil <= hoy)
            if (content.getAvailableUntil() != null && 
                !content.getAvailableUntil().isAfter(today)) {
                
                content.setState(ContentState.PRIVADO);
                content.setStateChangedAt(Instant.now());
                contentRepository.save(content);
                
                logger.info("Contenido '{}' (ID: {}) ocultado - caducó el {}", 
                    content.getTitle(), content.getId(), content.getAvailableUntil());
                hidden++;
            }
        }
        
        logger.info("Total contenidos ocultados: {}", hidden);
        logger.info("═══════════════════════════════════════════════════════");
    }
    
    /**
     * Task 516: Genera alertas para usuarios con acceso al contenido.
     * Aplica filtros de Premium y Edad.
     * Implementa anti-spam: solo 1 alerta por contenido/usuario.
     */
    private int alertUsersAboutExpiring(Content content) {
        List<User> allUsers = userRepository.findAll();
        int alertCount = 0;
        
        for (User user : allUsers) {
            // Verificar si ya se envió alerta (anti-spam)
            if (hasAlertBeenSent(content.getId(), user.getEmail(), ALERT_TYPE_EXPIRING_SOON)) {
                continue;
            }
            
            // Aplicar filtros de acceso
            if (!canUserAccessContent(user, content)) {
                continue;
            }
            
            // Crear notificación
            createExpirationNotification(user, content);
            
            // Registrar que se envió la alerta (anti-spam)
            recordAlert(content.getId(), user.getEmail(), ALERT_TYPE_EXPIRING_SOON);
            
            alertCount++;
        }
        
        if (alertCount > 0) {
            logger.info("Contenido '{}': {} alertas enviadas", content.getTitle(), alertCount);
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
            return false;
        }
        
        // Filtro 2: Edad mínima
        if (content.getEdadMinima() != null && content.getEdadMinima() > 0) {
            int userAge = calculateAge(user.getDateOfBirth());
            if (userAge < content.getEdadMinima()) {
                return false;
            }
        }
        
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
            logger.warn("Error al parsear fecha de nacimiento: {}", dateOfBirth);
            return 0;
        }
    }
    
    /**
     * Verifica si ya se envió una alerta (anti-spam)
     */
    private boolean hasAlertBeenSent(String contentId, String userId, String alertType) {
        return expirationAlertRepository
            .findByContentIdAndUserIdAndAlertType(contentId, userId, alertType)
            .isPresent();
    }
    
    /**
     * Registra que se envió una alerta
     */
    private void recordAlert(String contentId, String userId, String alertType) {
        ExpirationAlert alert = new ExpirationAlert(contentId, userId, LocalDate.now(), alertType);
        expirationAlertRepository.save(alert);
    }
    
    /**
     * Crea una notificación de caducidad próxima
     */
    private void createExpirationNotification(User user, Content content) {
        Notification notification = new Notification();
        notification.setUserId(user.getEmail());
        notification.setContentId(content.getId());
        notification.setContentTitle(content.getTitle());
        notification.setCreatorAlias(content.getCreatorAlias());
        notification.setMessage(String.format(
            "⏰ El contenido '%s' caducará en %d días. ¡No te lo pierdas!",
            content.getTitle(), DAYS_BEFORE_EXPIRATION));
        notification.setRead(false);
        
        notificationRepository.save(notification);
    }
}
