package grupo1.esimedia.controller;

import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.service.UserNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controlador REST para gestionar notificaciones de usuarios.
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserNotificationController {

    @Autowired
    private UserNotificationService userNotificationService;

    /**
     * Obtiene todas las notificaciones del usuario autenticado.
     * @param userId ID del usuario
     * @return Lista de notificaciones
     */
    @GetMapping
    public ResponseEntity<List<UserNotification>> getAllNotifications(@RequestParam String userId) {
        List<UserNotification> notifications = userNotificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Obtiene las notificaciones no leídas del usuario autenticado.
     * @param userId ID del usuario
     * @return Lista de notificaciones no leídas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<UserNotification>> getUnreadNotifications(@RequestParam String userId) {
        List<UserNotification> unreadNotifications = userNotificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(unreadNotifications);
    }

    /**
     * Obtiene el número de notificaciones no leídas del usuario.
     * @param userId ID del usuario
     * @return Objeto con el contador de notificaciones no leídas
     */
    @GetMapping("/unread/count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@RequestParam String userId) {
        long count = userNotificationService.getUnreadNotificationCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    /**
     * Obtiene una notificación específica por ID.
     * @param notificationId ID de la notificación
     * @return La notificación
     */
    @GetMapping("/{notificationId}")
    public ResponseEntity<UserNotification> getNotification(@PathVariable String notificationId) {
        Optional<UserNotification> notification = userNotificationService.getNotificationById(notificationId);
        return notification.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Crea una nueva notificación.
     * @param userNotification Los datos de la notificación
     * @return La notificación creada
     */
    @PostMapping
    public ResponseEntity<UserNotification> createNotification(@RequestBody UserNotification userNotification) {
        UserNotification created = userNotificationService.createNotification(userNotification);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Marca una notificación como leída.
     * @param notificationId ID de la notificación
     * @return La notificación actualizada
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<UserNotification> markAsRead(@PathVariable String notificationId) {
        Optional<UserNotification> notification = userNotificationService.markAsRead(notificationId);
        return notification.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Marca todas las notificaciones del usuario como leídas.
     * @param userId ID del usuario
     * @return Respuesta exitosa
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam String userId) {
        userNotificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Elimina una notificación específica.
     * @param notificationId ID de la notificación
     * @return Respuesta exitosa
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String notificationId) {
        userNotificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Elimina todas las notificaciones del usuario.
     * @param userId ID del usuario
     * @return Respuesta exitosa
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAllNotifications(@RequestParam String userId) {
        userNotificationService.deleteAllNotificationsByUserId(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Clase auxiliar para respuesta de contador de notificaciones no leídas.
     */
    public static class UnreadCountResponse {
        public long count;

        public UnreadCountResponse(long count) {
            this.count = count;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}
