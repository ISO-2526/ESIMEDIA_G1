package grupo1.esimedia.scheduler;

import grupo1.esimedia.Content.service.ContentExpirationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Tarea 514: Scheduler para ejecución diaria de tareas de expiración.
 * Ejecuta a las 03:00 AM todos los días en hora de baja carga.
 */
@Component
public class ContentExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ContentExpirationScheduler.class);

    @Autowired
    private ContentExpirationService expirationService;

    /**
     * Tarea programada: se ejecuta todos los días a las 03:00 AM.
     * Cron: segundos minutos horas día-del-mes mes día-de-semana
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void runDailyExpirationTasks() {
        log.info("═══════════════════════════════════════════════════════");
        log.info("🕐 [SCHEDULER] Iniciando tareas de expiración - {}", LocalDateTime.now());
        log.info("═══════════════════════════════════════════════════════");

        try {
            // 1. Alertar sobre contenidos que caducan en 7 días
            log.info("[SCHEDULER] Ejecutando: Alertas de contenido próximo a caducar...");
            expirationService.alertContentExpiringSoon();

            // 2. Caducar contenidos vencidos
            log.info("[SCHEDULER] Ejecutando: Expiración de contenidos vencidos...");
            expirationService.expireOldContent();

            log.info("═══════════════════════════════════════════════════════");
            log.info("✅ [SCHEDULER] Tareas de expiración completadas");
            log.info("═══════════════════════════════════════════════════════");

        } catch (Exception e) {
            log.error("❌ [SCHEDULER] Error en tareas de expiración", e);
        }
    }
}
