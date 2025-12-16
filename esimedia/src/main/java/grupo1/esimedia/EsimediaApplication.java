package grupo1.esimedia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import grupo1.esimedia.accounts.model.Admin;
import grupo1.esimedia.accounts.model.Department;
import grupo1.esimedia.accounts.repository.AdminRepository;
import grupo1.esimedia.utils.PasswordUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@SpringBootApplication
public class EsimediaApplication {

	private static final Logger log = LoggerFactory.getLogger(EsimediaApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(EsimediaApplication.class, args);
	}

    @Bean
    public CommandLineRunner ensureDefaultAdmin(AdminRepository adminRepository, PasswordUtils passwordUtils) {
        return args -> {
            long count = adminRepository.count();
            if (count == 0) {
                
                // ✅ USAR PasswordUtils con SHA-256 + bcrypt + pepper
                String plainPassword = Optional.ofNullable(System.getenv("ESIMEDIA_ADMIN_PASSWORD")).orElse("admin123");
                String hashedPassword = passwordUtils.hashPassword(plainPassword);
                
                String email = Optional.ofNullable(System.getenv("ESIMEDIA_ADMIN_EMAIL")).orElse("admin@esimedia.local");
                String name = Optional.ofNullable(System.getenv("ESIMEDIA_ADMIN_NAME")).orElse("System");
                String surname = Optional.ofNullable(System.getenv("ESIMEDIA_ADMIN_SURNAME")).orElse("Administrator");
                String dept = Optional.ofNullable(System.getenv("ESIMEDIA_ADMIN_DEPARTMENT")).orElse("CUSTOMER_SUPPORT");

                Admin a = new Admin();
                a.setEmail(email);
                a.setPassword(hashedPassword);
                a.setName(name);
                a.setSurname(surname);
                try {
                    a.setDepartment(Department.valueOf(dept));
                } catch (IllegalArgumentException e) {
                    a.setDepartment(Department.CUSTOMER_SUPPORT);
                }
                adminRepository.save(a);
                log.info("═══════════════════════════════════════════════════════");
                log.info("✅ [BOOT] Admin por defecto creado exitosamente");
                log.info("📧 Email: {}", email);
                log.info("🔐 Contraseña almacenada con SHA-256 + bcrypt + pepper");
                log.info("👤 Nombre: {} {}", name, surname);
                log.info("🏢 Departamento: {}", dept);
                log.info("═══════════════════════════════════════════════════════");
            } else {
                log.info("[BOOT] ℹ️  Ya existen {} administrador(es) en la base de datos", count);
            }
        };
    }

}
