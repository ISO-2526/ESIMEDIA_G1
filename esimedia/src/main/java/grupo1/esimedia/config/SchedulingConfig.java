package grupo1.esimedia.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuración para habilitar tareas programadas (HDU 493)
 * Permite el uso de @Scheduled en la aplicación
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // La configuración de scheduling se activa automáticamente
    // Las tareas se definen con @Scheduled en ContentExpirationScheduler
}
