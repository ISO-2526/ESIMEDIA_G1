package com.esimedia.content.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.esimedia.content.model.ExpirationAlert;

import java.util.Optional;

/**
 * Repositorio para alertas de caducidad (HDU 493 - Task 516)
 */
@Repository
public interface ExpirationAlertRepository extends MongoRepository<ExpirationAlert, String> {
    
    /**
     * Busca si ya existe una alerta enviada para un contenido/usuario/tipo
     * Usado para evitar spam (no enviar la misma alerta dos veces)
     */
    Optional<ExpirationAlert> findByContentIdAndUserIdAndAlertType(String contentId, String userId, String alertType);
    
    /**
     * Cuenta alertas por contenido y tipo
     */
    long countByContentIdAndAlertType(String contentId, String alertType);
}
