package com.esimedia.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.esimedia.model.UserNotification;
import com.esimedia.service.UserNotificationService;

/**
 * Controlador para testing de notificaciones (SOLO DESARROLLO)
 * NOTA: Eliminar en producción
 */
@RestController
@RequestMapping("/api/notifications/test")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class NotificationTestController {

    @Autowired
    private UserNotificationService userNotificationService;

    /**
     * Crea una notificación de prueba.
     * @param userId ID del usuario
     * @param title Título de la notificación
     * @param message Mensaje de la notificación
     * @param type Tipo: INFO, WARNING, ERROR, SUCCESS
     * @return La notificación creada
     */
    @GetMapping("/create")
    public ResponseEntity<UserNotification> createTestNotification(
            @RequestParam String userId,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(defaultValue = "INFO") String type) {
        
        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type.toUpperCase());
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        
        UserNotification created = userNotificationService.createNotification(notification);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Crea múltiples notificaciones de prueba.
     * @param userId ID del usuario
     * @return Mensaje de éxito
     */
    @GetMapping("/create-batch")
    public ResponseEntity<String> createBatchNotifications(@RequestParam String userId) {
        String[] titles = {
            "Nuevo contenido disponible",
            "Tu suscripción vence pronto",
            "Error en la reproducción",
            "¡Felicidades por tu primer video!",
            "Actualización de seguridad"
        };
        
        String[] messages = {
            "Se han subido 3 nuevos videos en tu categoría favorita",
            "Tu plan VIP vence en 7 días. ¡Renuévalo ahora!",
            "No pudimos reproducir el archivo. Intenta más tarde.",
            "Has completado tu primer video en la plataforma",
            "Se detectó acceso desde nueva ubicación. Verifica tu cuenta."
        };
        
        String[] types = {
            "INFO",
            "WARNING",
            "ERROR",
            "SUCCESS",
            "WARNING"
        };
        
        for (int i = 0; i < titles.length; i++) {
            UserNotification notification = new UserNotification();
            notification.setUserId(userId);
            notification.setTitle(titles[i]);
            notification.setMessage(messages[i]);
            notification.setType(types[i]);
            notification.setRead(false);
            notification.setCreatedAt(java.time.LocalDateTime.now().minusHours(i));
            userNotificationService.createNotification(notification);
        }
        
        return ResponseEntity.ok("5 notificaciones de prueba creadas");
    }
}
