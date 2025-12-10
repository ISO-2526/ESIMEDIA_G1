package grupo1.esimedia.Accounts.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import grupo1.esimedia.Accounts.dto.request.CreateAdminRequestDTO;
import grupo1.esimedia.Accounts.dto.request.CreateCreatorRequestDTO;
import grupo1.esimedia.Accounts.dto.request.SetActiveRequestDTO;
import grupo1.esimedia.Accounts.model.Admin;
import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.service.TwoFactorAuthService;
import grupo1.esimedia.utils.PasswordUtils;

@RestController
@RequestMapping("/api/admins")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private ContentCreatorRepository contentCreatorRepository;
    
    @Autowired
    private UserRepository userRepository;

    
    @Autowired
    private TwoFactorAuthService twoFactorAuthService;
    
    @Autowired
    private PasswordUtils passwordUtils;
    
    public AdminController(AdminRepository adminRepository, TwoFactorAuthService twoFactorAuthService, ContentCreatorRepository contentCreatorRepository, UserRepository userRepository) {
        this.adminRepository = adminRepository;
        this.contentCreatorRepository = contentCreatorRepository;
        this.userRepository = userRepository;
        this.twoFactorAuthService = twoFactorAuthService;
    }

    @PostMapping(path = "/admin", consumes = "application/json")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody CreateAdminRequestDTO adminDTO, HttpServletRequest req) {

        if (adminRepository.existsById(adminDTO.getEmail()) ||
            userRepository.existsById(adminDTO.getEmail()) ||
            contentCreatorRepository.existsById(adminDTO.getEmail())) {
            return ResponseEntity.status(400).body("Error: El email ya está registrado.");
        }

        Admin admin = new Admin();
        admin.setEmail(adminDTO.getEmail());
        admin.setPassword(adminDTO.getPassword());

        admin.setName(adminDTO.getName());
        admin.setSurname(adminDTO.getSurname());
        admin.setDepartment(adminDTO.getDepartment());
        admin.setPicture(adminDTO.getPicture());

        admin.setPassword(passwordUtils.hashPassword(admin.getPassword()));
        admin.setLastPasswordChangeAt(Instant.now());
        admin.addPasswordToHistory(admin.getPassword());
        String key = twoFactorAuthService.generateSecretKey();
        admin.setTwoFactorSecretKey(key);
        admin.setThirdFactorEnabled(true);
        admin.setActive(true);
        Admin saved = adminRepository.save(admin);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }
    
    @PostMapping(path = "/creator", consumes = "application/json")
    public ResponseEntity<?> createContentCreator(@Valid @RequestBody CreateCreatorRequestDTO creatorDTO, HttpServletRequest req) {

        if (contentCreatorRepository.existsById(creatorDTO.getEmail()) ||
            adminRepository.existsById(creatorDTO.getEmail()) ||
            userRepository.existsById(creatorDTO.getEmail())) {
            return ResponseEntity.status(400).body("Error: El email ya está registrado.");
        }
        
        if (aliasExists(creatorDTO.getAlias())) {
            return ResponseEntity.status(400).body("Error: El alias ya está en uso.");
        }

        ContentCreator creator = new ContentCreator();
        creator.setEmail(creatorDTO.getEmail());
        creator.setPassword(creatorDTO.getPassword());
        creator.setName(creatorDTO.getName());
        creator.setSurname(creatorDTO.getSurname());
        creator.setAlias(creatorDTO.getAlias());
        creator.setContentType(creatorDTO.getContentType());

        creator.setPassword(passwordUtils.hashPassword(creator.getPassword()));
        creator.setLastPasswordChangeAt(Instant.now());
        creator.addPasswordToHistory(creator.getPassword());
        
        String key = twoFactorAuthService.generateSecretKey();
        creator.setTwoFactorSecretKey(key);
        creator.setThirdFactorEnabled(true);
        ContentCreator saved = contentCreatorRepository.save(creator);
        saved.setActive(true);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping(path = "/admins", produces = "application/json")
    public ResponseEntity<List<Admin>> getAllAdmins(HttpServletRequest req) {
        List<Admin> admins = adminRepository.findAll();
        for (Admin a : admins) { if (a != null) a.setPassword(null); }
        return ResponseEntity.ok(admins);
    }

    @GetMapping(path = "/creators", produces = "application/json")
    public ResponseEntity<List<ContentCreator>> getAllContentCreators(HttpServletRequest req) {
        List<ContentCreator> creators = contentCreatorRepository.findAll();
        for (ContentCreator c : creators) { if (c != null) c.setPassword(null); }
        return ResponseEntity.ok(creators);
    }

    @GetMapping(path = "/{email:.+}", produces = "application/json")
    public ResponseEntity<Admin> getAdminByEmail(@PathVariable String email, HttpServletRequest req) {
        var opt = adminRepository.findById(email);
        if (opt.isEmpty()) {
            for (Admin a : adminRepository.findAll()) {
                if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(a); break; }
            }
        }
        return opt.map(a -> { a.setPassword(null); return ResponseEntity.ok(a); }).orElse(ResponseEntity.status(404).build());
    }

    @PutMapping(path = "/{email:.+}/active", consumes = "application/json")
    public ResponseEntity<?> setAdminActive(@PathVariable String email, @Valid @RequestBody SetActiveRequestDTO body, HttpServletRequest req) {

        var adminOpt = findAdminByEmailCaseInsensitive(email);
        
        return adminOpt.map(existing -> {
            ResponseEntity<?> validationError = validateAdminDeactivation(existing, body.getActive());
            if (validationError != null) return validationError;
            
            // BUG: variable 'active' no definida -> usar el valor del DTO
            existing.setActive(body.getActive());
            Admin saved = adminRepository.save(existing);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.status(404).build());
    }

    private ResponseEntity<?> validateAdminDeactivation(Admin admin, boolean active) {
        if (active) return null;
        
        long activeCount = adminRepository.findAll().stream().filter(Admin::isActive).count();
        if (admin.isActive() && activeCount <= 1) {
            return ResponseEntity.status(400).body("Cannot deactivate the last active admin.");
        }
        return null;
    }

    @DeleteMapping(path = "/{email:.+}")
    public ResponseEntity<?> deleteAdmin(@PathVariable String email, HttpServletRequest req) {
        var adminOpt = adminRepository.findById(email);
        if (adminOpt.isEmpty()) {
            for (Admin a : adminRepository.findAll()) {
                if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) { adminOpt = java.util.Optional.of(a); break; }
            }
        }
        if (adminOpt.isEmpty()) return ResponseEntity.status(404).build();
        long totalAdmins = adminRepository.count();
        if (totalAdmins <= 1) {
            return ResponseEntity.status(400).body("Cannot delete the only admin in the system.");
        }
        adminRepository.delete(adminOpt.get());
        return ResponseEntity.ok().build();
    }

    @GetMapping(path = "/creators/{email:.+}", produces = "application/json")
    public ResponseEntity<ContentCreator> getCreatorByEmail(@PathVariable String email, HttpServletRequest req) {
        var opt = contentCreatorRepository.findById(email);
        if (opt.isEmpty()) {
            for (ContentCreator c : contentCreatorRepository.findAll()) {
                if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(c); break; }
			}
		}
		return opt.map(c -> { c.setPassword(null); return ResponseEntity.ok(c); }).orElse(ResponseEntity.status(404).build());
	}

	@PutMapping(path = "/creators/{email:.+}/active", consumes = "application/json")
	public ResponseEntity<?> setCreatorActive(@PathVariable String email, @Valid @RequestBody SetActiveRequestDTO body, HttpServletRequest req) {

		var opt = contentCreatorRepository.findById(email);
		if (opt.isEmpty()) {
			for (ContentCreator c : contentCreatorRepository.findAll()) {
				if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(c); break; }
			}
		}
		return opt.map(existing -> {
			existing.setActive(body.getActive());
				ContentCreator saved = contentCreatorRepository.save(existing);
				saved.setPassword(null);
				return ResponseEntity.ok(saved);
		}).orElse(ResponseEntity.status(404).build());
	}

	@DeleteMapping(path = "/creators/{email:.+}")
	public ResponseEntity<?> deleteCreator(@PathVariable String email, HttpServletRequest req) {
		var opt = contentCreatorRepository.findById(email);
		if (opt.isEmpty()) {
			for (ContentCreator c : contentCreatorRepository.findAll()) {
				if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(c); break; }
			}
		}
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		contentCreatorRepository.delete(opt.get());
		return ResponseEntity.ok().build();
	}

	@PutMapping(path = "/{email:.+}", consumes = "application/json")
    public ResponseEntity<?> updateAdmin(@PathVariable String email,
                                         @RequestBody Map<String, Object> body,
                                         HttpServletRequest req) {

        var adminOpt = findAdminByEmailCaseInsensitive(email);
        if (adminOpt.isEmpty()) return ResponseEntity.status(404).build();

        Admin existing = adminOpt.get();
        updateAdminFields(existing, body);

        Admin saved = adminRepository.save(existing);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

	private java.util.Optional<Admin> findAdminByEmailCaseInsensitive(String email) {
		var adminOpt = adminRepository.findById(email);
		if (adminOpt.isPresent()) {
			return adminOpt;
		}
		
		for (Admin a : adminRepository.findAll()) {
			if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) {
				return java.util.Optional.of(a);
			}
		}
		return java.util.Optional.empty();
	}

	private void updateAdminFields(Admin existing, Map<String, Object> body) {
		if (body.containsKey("name") && body.get("name") instanceof String) {
			existing.setName(((String) body.get("name")).trim());
		}
		if (body.containsKey("surname") && body.get("surname") instanceof String) {
			existing.setSurname(((String) body.get("surname")).trim());
		}
		if (body.containsKey("department") && body.get("department") instanceof String) {
			try {
				var dep = grupo1.esimedia.Accounts.model.Department.valueOf(((String) body.get("department")).trim());
				existing.setDepartment(dep);
			} catch (IllegalArgumentException ignored) {
			}
		}
		if (body.containsKey("picture") && body.get("picture") instanceof String) {
			existing.setPicture((String) body.get("picture"));
		}
		if (body.containsKey("active")) {
			Object o = body.get("active");
			if (o instanceof Boolean) existing.setActive((Boolean) o);
			else if (o instanceof String) existing.setActive(Boolean.parseBoolean((String) o));
		}
	}

    // Helper para validar alias sin depender de existsByAlias en el repositorio
    private boolean aliasExists(String alias) {
        if (alias == null) return false;
        return contentCreatorRepository.findAll().stream()
            .anyMatch(c -> c.getAlias() != null && c.getAlias().equalsIgnoreCase(alias));
    }
}