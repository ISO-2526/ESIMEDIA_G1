package grupo1.esimedia.Accounts.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import grupo1.esimedia.Accounts.model.Admin;
import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.service.TwoFactorAuthService;
import grupo1.esimedia.utils.PasswordUtils; // ✅ AGREGAR
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admins")
public class AdminController {
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private ContentCreatorRepository contentCreatorRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TokenRepository tokenRepository;
    
    @Autowired
    private TwoFactorAuthService twoFactorAuthService;
    
    // ✅ AGREGAR PasswordUtils
    @Autowired
    private PasswordUtils passwordUtils;
    
    // private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    private boolean isRequestAdmin(HttpServletRequest req) {
        try {
            Cookie[] cookies = req.getCookies();
            if (cookies == null) return false;
            String tokenId = null;
            for (Cookie c : cookies) {
                if ("access_token".equals(c.getName())) { tokenId = c.getValue(); break; }
            }
            if (tokenId == null || tokenId.isBlank()) return false;

            var tokenOpt = tokenRepository.findById(tokenId);
            if (tokenOpt.isEmpty()) return false;
            var token = tokenOpt.get();


            if (token.getExpiration() == null || token.getExpiration().isBefore(LocalDateTime.now())) return false;
            if (!"admin".equals(token.getRole())) return false;

            // Verificar que la cuenta admin exista y esté activa
            var adminOpt = adminRepository.findById(token.getAccountId());
            return adminOpt.isPresent() && adminOpt.get().isActive();
        } catch (Exception e) {
            return false;
        }
    }

	public AdminController(AdminRepository adminRepository, TwoFactorAuthService twoFactorAuthService, ContentCreatorRepository contentCreatorRepository, UserRepository userRepository) {
		this.adminRepository = adminRepository;
		this.contentCreatorRepository = contentCreatorRepository;
		this.userRepository = userRepository;
		this.twoFactorAuthService = twoFactorAuthService;
	}

	@PostMapping(path = "/admin", consumes = "application/json")
	public ResponseEntity<?> createAdmin(@RequestBody Admin admin, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		
		// Validación de campos requeridos
		if (admin.getEmail() == null || admin.getEmail().isBlank() || 
			admin.getPassword() == null || admin.getPassword().isBlank() || 
			admin.getName() == null || admin.getName().isBlank() || 
			admin.getSurname() == null || admin.getSurname().isBlank() || 
			admin.getDepartment() == null) {
			return ResponseEntity.status(400).body("Error: Missing required fields for admin.");
		}
		
		if (adminRepository.existsById(admin.getEmail()) || 
			userRepository.existsById(admin.getEmail()) || 
			contentCreatorRepository.existsById(admin.getEmail())) {
			return ResponseEntity.status(400).body("Error: El email ya está registrado.");
		}
		
		// ✅ USAR PasswordUtils CON PEPPER
		admin.setPassword(passwordUtils.hashPassword(admin.getPassword()));
		
		String key = twoFactorAuthService.generateSecretKey();
		admin.setTwoFactorSecretKey(key);
		admin.setThirdFactorEnabled(true);
		Admin saved = adminRepository.save(admin);
		saved.setPassword(null);
		return ResponseEntity.ok(saved);
	}
	
	@PostMapping(path = "/creator", consumes = "application/json")
	public ResponseEntity<?> createContentCreator(@RequestBody ContentCreator creator, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		
		// Validación de campos requeridos
		if (creator.getEmail() == null || creator.getEmail().isBlank() || 
			creator.getPassword() == null || creator.getPassword().isBlank() || 
			creator.getName() == null || creator.getName().isBlank() || 
			creator.getSurname() == null || creator.getSurname().isBlank() || 
			creator.getAlias() == null || creator.getAlias().isBlank() || 
			creator.getSpecialty() == null || creator.getContentType() == null) {
			return ResponseEntity.status(400).body("Error: Missing required fields for content creator.");
		}
		
		if (contentCreatorRepository.existsById(creator.getEmail()) || 
			adminRepository.existsById(creator.getEmail()) || 
			userRepository.existsById(creator.getEmail())) {
			return ResponseEntity.status(400).body("Error: El email ya está registrado.");
		}
		
		if (contentCreatorRepository.existsByAlias(creator.getAlias())) {
			return ResponseEntity.status(400).body("Error: El alias ya está en uso.");
		}

		// ✅ USAR PasswordUtils CON PEPPER
		creator.setPassword(passwordUtils.hashPassword(creator.getPassword()));
		
		String key = twoFactorAuthService.generateSecretKey();
		creator.setTwoFactorSecretKey(key);
		creator.setThirdFactorEnabled(true);
		ContentCreator saved = contentCreatorRepository.save(creator);
		saved.setPassword(null);
		return ResponseEntity.ok(saved);
	}
	
	@GetMapping(path = "/admins", produces = "application/json")
	public ResponseEntity<List<Admin>> getAllAdmins(HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		List<Admin> admins = adminRepository.findAll();
		// strip passwords
		for (Admin a : admins) { if (a != null) a.setPassword(null); }
		return ResponseEntity.ok(admins);
	}

	@GetMapping(path = "/creators", produces = "application/json")
	public ResponseEntity<List<ContentCreator>> getAllContentCreators(HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		List<ContentCreator> creators = contentCreatorRepository.findAll();
		for (ContentCreator c : creators) { if (c != null) c.setPassword(null); }
		return ResponseEntity.ok(creators);
	}

	@GetMapping(path = "/{email:.+}", produces = "application/json")
	public ResponseEntity<Admin> getAdminByEmail(@PathVariable String email, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		var opt = adminRepository.findById(email);
		if (opt.isEmpty()) {
			for (Admin a : adminRepository.findAll()) {
				if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(a); break; }
			}
		}
		return opt.map(a -> { a.setPassword(null); return ResponseEntity.ok(a); }).orElse(ResponseEntity.status(404).build());
	}

	// Toggle or set active flag for an admin (requires admin headers)
	@PutMapping(path = "/{email:.+}/active", consumes = "application/json")
	public ResponseEntity<?> setAdminActive(@PathVariable String email, @RequestBody Map<String, Object> body, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		
		var activeObj = body.get("active");
		if (activeObj == null) return ResponseEntity.badRequest().body("Missing 'active' field");
		
		final boolean active = (activeObj instanceof Boolean) ? (Boolean) activeObj : Boolean.parseBoolean(activeObj.toString());
		var adminOpt = findAdminByEmailCaseInsensitive(email);
		
		return adminOpt.map(existing -> {
			ResponseEntity<?> validationError = validateAdminDeactivation(existing, active);
			if (validationError != null) return validationError;
			
			existing.setActive(active);
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
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		var adminOpt = adminRepository.findById(email);
		if (adminOpt.isEmpty()) {
			for (Admin a : adminRepository.findAll()) {
				if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) { adminOpt = java.util.Optional.of(a); break; }
			}
		}
		if (adminOpt.isEmpty()) return ResponseEntity.status(404).build();
		// Prevent deleting the last admin in the system
		long totalAdmins = adminRepository.count();
		if (totalAdmins <= 1) {
			return ResponseEntity.status(400).body("Cannot delete the only admin in the system.");
		}
		adminRepository.delete(adminOpt.get());
		return ResponseEntity.ok().build();
	}

	// ContentCreator: get by email
	@GetMapping(path = "/creators/{email:.+}", produces = "application/json")
	public ResponseEntity<ContentCreator> getCreatorByEmail(@PathVariable String email, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		var opt = contentCreatorRepository.findById(email);
		if (opt.isEmpty()) {
			for (ContentCreator c : contentCreatorRepository.findAll()) {
				if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(c); break; }
			}
		}
		return opt.map(c -> { c.setPassword(null); return ResponseEntity.ok(c); }).orElse(ResponseEntity.status(404).build());
	}

	@PutMapping(path = "/creators/{email:.+}/active", consumes = "application/json")
	public ResponseEntity<?> setCreatorActive(@PathVariable String email, @RequestBody Map<String, Object> body, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
		var activeObj = body.get("active");
		if (activeObj == null) return ResponseEntity.badRequest().body("Missing 'active' field");
		final boolean active = (activeObj instanceof Boolean) ? (Boolean) activeObj : Boolean.parseBoolean(activeObj.toString());

		var opt = contentCreatorRepository.findById(email);
		if (opt.isEmpty()) {
			for (ContentCreator c : contentCreatorRepository.findAll()) {
				if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(c); break; }
			}
		}
		return opt.map(existing -> {
			existing.setActive(active);
				ContentCreator saved = contentCreatorRepository.save(existing);
				// strip password
				saved.setPassword(null);
				return ResponseEntity.ok(saved);
		}).orElse(ResponseEntity.status(404).build());
	}

	@DeleteMapping(path = "/creators/{email:.+}")
	public ResponseEntity<?> deleteCreator(@PathVariable String email, HttpServletRequest req) {
		if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();
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
        if (!isRequestAdmin(req)) return ResponseEntity.status(401).build();

        var adminOpt = findAdminByEmailCaseInsensitive(email);
        if (adminOpt.isEmpty()) return ResponseEntity.status(404).build();

        Admin existing = adminOpt.get();
        updateAdminFields(existing, body);

        Admin saved = adminRepository.save(existing);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

	private boolean isAuthorizedAdmin(String headerRole, String headerEmail) {
		return headerRole != null && headerRole.equals("admin") && headerEmail != null && !headerEmail.isBlank();
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
		// update allowed fields: name, surname, department, picture, active
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
				// invalid department - ignore or could return 400
			}
		}
		if (body.containsKey("picture") && body.get("picture") instanceof String) {
			existing.setPicture((String) body.get("picture"));
		}
		// password changes are not allowed through this admin-edit endpoint (admins should not see or set passwords)
		if (body.containsKey("active")) {
			Object o = body.get("active");
			if (o instanceof Boolean) existing.setActive((Boolean) o);
			else if (o instanceof String) existing.setActive(Boolean.parseBoolean((String) o));
		}
	}
}
