package com.esimedia.content.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.esimedia.content.model.NotificationAntiSpam;

import java.util.Optional;

/**
 * Repositorio para gestionar registros anti-spam de notificaciones.
 */
@Repository
public interface NotificationAntiSpamRepository extends MongoRepository<NotificationAntiSpam, String> {
    
    /**
     * Verifica si ya existe un registro anti-spam para una notificación específica.
     * @param contentId ID del contenido
     * @param userId Email del usuario
     * @param notificationType Tipo de notificación ("CONTENT_PUBLISHED", "CONTENT_EXPIRING")
     * @return Optional con el registro si existe
     */
    Optional<NotificationAntiSpam> findByContentIdAndUserIdAndNotificationType(
        String contentId, String userId, String notificationType);
}
