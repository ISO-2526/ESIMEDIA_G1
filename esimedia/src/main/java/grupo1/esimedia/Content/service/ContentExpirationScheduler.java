package grupo1.esimedia.content.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler para la ejecución automática de tareas de caducidad (HDU 493 - Task 514)
 * 
 * Se ejecuta todos los días a las 03:00 AM para:
 * 1. Alertar usuarios sobre contenidos que caducan en 7 días
 * 2. Ocultar contenidos que ya han caducado
 */
@Component
public class ContentExpirationScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(ContentExpirationScheduler.class);
    
    @Autowired
    private ContentExpirationService contentExpirationService;
    
    /**
     * Tarea programada que se ejecuta todos los días a las 03:00 AM
     * Cron: segundo minuto hora día-del-mes mes día-de-la-semana
     * "0 0 3 * * *" = a las 03:00:00 todos los días
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void runDailyExpirationCheck() {
        logger.info("╔═══════════════════════════════════════════════════════╗");
        logger.info("║  HDU 493 - TAREA PROGRAMADA DE CADUCIDAD INICIADA     ║");
        logger.info("╚═══════════════════════════════════════════════════════╝");
        
        try {
            // Paso 1: Alertar sobre contenidos que caducan en 7 días
            logger.info("📢 Paso 1: Verificando contenidos que caducan pronto...");
            contentExpirationService.checkAndAlertExpiringContent();
            
            // Paso 2: Ocultar contenidos ya vencidos
            logger.info("🔒 Paso 2: Procesando contenidos vencidos...");
            contentExpirationService.processExpiredContent();
            
            logger.info("╔═══════════════════════════════════════════════════════╗");
            logger.info("║  HDU 493 - TAREA DE CADUCIDAD COMPLETADA              ║");
            logger.info("╚═══════════════════════════════════════════════════════╝");
            
        } catch (Exception e) {
            logger.error("❌ Error en tarea de caducidad: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Método para ejecutar manualmente (útil para testing o administración)
     */
    public void runManually() {
        logger.info("⚡ Ejecución manual de tarea de caducidad iniciada");
        runDailyExpirationCheck();
    }
}
