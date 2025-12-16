package com.esimedia.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.esimedia.model.UserNotification;

import java.util.List;

/**
 * Repositorio para la entidad UserNotification en MongoDB.
 */
@Repository
public interface UserNotificationRepository extends MongoRepository<UserNotification, String> {

    /**
     * Obtiene todas las notificaciones de un usuario ordenadas por fecha descendente.
     * @param userId ID del usuario
     * @return Lista de notificaciones del usuario
     */
    List<UserNotification> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Obtiene todas las notificaciones no leídas de un usuario.
     * @param userId ID del usuario
     * @return Lista de notificaciones no leídas
     */
    List<UserNotification> findByUserIdAndReadFalse(String userId);

    /**
     * Obtiene notificaciones no leídas de un usuario ordenadas por fecha de creación.
     * @param userId ID del usuario
     * @return Lista de notificaciones no leídas ordenadas
     */
    List<UserNotification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    /**
     * Elimina todas las notificaciones de un usuario.
     * @param userId ID del usuario
     */
    void deleteByUserId(String userId);

    /**
     * Cuenta las notificaciones no leídas de un usuario.
     * @param userId ID del usuario
     * @return Número de notificaciones no leídas
     */
    long countByUserIdAndReadFalse(String userId);
}
