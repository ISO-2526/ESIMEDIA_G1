package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.model.Playlist;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.PlaylistRepository;
import grupo1.esimedia.Accounts.service.EmailService;
import grupo1.esimedia.utils.PasswordUtils;
import grupo1.esimedia.Accounts.dto.request.CreateUserRequestDTO;
import grupo1.esimedia.Accounts.dto.response.UserResponseDTO;
import jakarta.validation.Valid;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

import java.util.stream.Collectors;
import java.time.Instant;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final String ERROR = "error";

    private static final String MESSAGE = "message";

    private static final String ACTIVE =  "active";

    private static final String FAVORITES = "favorites";

    private static final String USUARIONOENCONTRADO = "Usuario no encontrado";

    private static final String SURNAME = "surname";

    private static final String ALIAS = "alias";

    private static final String PICTURE = "picture";

    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContentCreatorRepository contentCreatorRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private PasswordUtils passwordUtils;
    
    @Autowired
    private PlaylistRepository playlistRepository;
    
    @Autowired
    private EmailService emailService;


    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequestDTO dto) {
        if (userRepository.existsById(dto.getEmail()) || 
            contentCreatorRepository.existsById(dto.getEmail()) || 
            adminRepository.existsById(dto.getEmail())) {
            return ResponseEntity.status(400).body("Error al crear cuenta.");
        }

        // VALIDAR CONTRASEÑA CON DICCIONARIO + INFORMACIÓN PERSONAL
        List<String> passwordErrors = passwordUtils.validatePasswordPersonalInfo(
            dto.getPassword(),
            dto.getEmail(),
            dto.getName(),
            dto.getSurname(),
            dto.getAlias()
        );
        
        if (!passwordErrors.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                ERROR, "PASSWORD_WEAK",
                MESSAGE, passwordErrors.get(0)
            ));
        }

        // Crear User desde DTO
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordUtils.hashPassword(dto.getPassword()));
        user.setLastPasswordChangeAt(Instant.now());
        user.addPasswordToHistory(user.getPassword());
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setAlias(dto.getAlias());
        user.setDateOfBirth(dto.getDateOfBirth().toString());
        user.setVip(dto.isVip());
        user.setPicture(dto.getPicture());

        // Guardar el usuario en la base de datos
        User saved = userRepository.save(user);
        // Crear automáticamente la lista "Favoritos" para el nuevo usuario
        createFavoritosPlaylist(user.getEmail());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toUserResponseDTO(saved));
    }

    @GetMapping(path = "", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userRepository.findAll().stream()
            .map(this::toUserResponseDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping(path = "/{email:.+}", produces = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        var opt = findUserByEmail(email);
        return opt.map(u -> ResponseEntity.ok(toUserResponseDTO(u)))
                .orElse(ResponseEntity.status(404).build());
    }

    @PutMapping(path = "/{email:.+}/active", consumes = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setUserActive(@PathVariable String email, @RequestBody Map<String, Object> body) {
        Object activeObj = body.get(ACTIVE);
        if (activeObj == null) return ResponseEntity.badRequest().body("Missing 'active' field");
        final boolean active = (activeObj instanceof Boolean) ? (Boolean) activeObj : Boolean.parseBoolean(activeObj.toString());
        var opt = userRepository.findById(email);
        if (opt.isEmpty()) {
            for (User u : userRepository.findAll()) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(u); break; }
            }
        }
        return opt.map(existing -> {
            existing.setActive(active);
            User saved = userRepository.save(existing);
            return ResponseEntity.ok(toUserResponseDTO(saved));
        }).orElse(ResponseEntity.status(404).build());
    }

    @PutMapping(path = "/{email:.+}", consumes = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable String email, @RequestBody Map<String, Object> body) {


        var opt = findUserByEmail(email);
        
        return opt.map(existing -> {
            updateUserFields(existing, body);
            User saved = userRepository.save(existing);
            return ResponseEntity.ok(toUserResponseDTO(saved));
        }).orElse(ResponseEntity.status(404).build());
    }

    // Get user favorites
    @GetMapping(path = "/favorites", produces = "application/json")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<String>> getUserFavorites() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        User user = opt.get();
        List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new ArrayList<>();
        }
        
        return ResponseEntity.ok(favorites);
    }

    // Add content to favorites
    @PostMapping(path = "/favorites/{contentId}")
        @PreAuthorize("hasRole('USER')")

    public ResponseEntity<?> addToFavorites(@PathVariable String contentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            // Create user if doesn't exist
            User newUser = new User();
            newUser.setEmail(userEmail);
            newUser.setFavorites(new ArrayList<>());
            newUser.getFavorites().add(contentId);
            userRepository.save(newUser);
            return ResponseEntity.ok(Map.of(MESSAGE, "Added to favorites", FAVORITES, newUser.getFavorites()));
        }
        
        User user = opt.get();
        List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new ArrayList<>();
        }
        
        // Check if already in favorites
        if (favorites.contains(contentId)) {
            return ResponseEntity.status(400).body(Map.of(ERROR, "Content already in favorites"));
        }
        
        favorites.add(contentId);
        user.setFavorites(favorites);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(MESSAGE, "Added to favorites", FAVORITES, favorites));
    }

    // Remove content from favorites
    @DeleteMapping(path = "/favorites/{contentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> removeFromFavorites(@PathVariable String contentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        User user = opt.get();
        List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new ArrayList<>();
        }
        
        favorites.remove(contentId);
        user.setFavorites(favorites);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(MESSAGE, "Removed from favorites", FAVORITES, favorites));
    }

    //Reset password functionality(obsoleto)
    @PostMapping(path = "/reset-password", consumes = "application/json")
    public ResponseEntity<?> recoverPassword(@RequestBody Map<String, Object> body) {
        Object token = body.get("token");
        String password = body.get("password") != null ? body.get("password").toString() : null;
         if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Missing or invalid 'password' field");
        }
        String token1 = ((String) token).trim();
            if (token1 == null || token1.isBlank()) {
                return ResponseEntity.badRequest().body("Missing or invalid 'token' field");
            }
        // find user by token

        User user = userRepository.findByResetToken(token1);
        // check token expiration

        if (user.getTokenExpiration() == null || user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body("Token expired");
        }

        //Set the password from the inputs of the method
        password = passwordUtils.hashPassword(password);
        user.setPassword(password);
        user.setLastPasswordChangeAt(Instant.now());
        user.addPasswordToHistory(user.getPassword());
        user.setResetToken(null);
        user.setTokenExpiration(null);
        emailService.sendEmail(user.getEmail(), "Password Reset", "Your password has been reset successfully.");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(MESSAGE, "Password reset"));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(USUARIONOENCONTRADO);
        }
        return ResponseEntity.ok(toUserResponseDTO(user));
    }

    @PutMapping("/editUser")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> editUser(@RequestBody User updatedUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(USUARIONOENCONTRADO);
        }

        // Actualizar los campos permitidos
        user.setName(updatedUser.getName());
        user.setSurname(updatedUser.getSurname());
        user.setAlias(updatedUser.getAlias());
        user.setPicture(updatedUser.getPicture());

        userRepository.save(user);
        return ResponseEntity.ok(toUserResponseDTO(user));
    }   

    @GetMapping("/2fa/setup")
    public ResponseEntity<Map<String, String>> setupTwoFactorAuth(@RequestParam String email) {
        // Validar formato del correo electrónico
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, "Correo electrónico inválido"));
        }

        // Buscar usuario
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR, USUARIONOENCONTRADO));
        }

        try {
            // Verificar si ya existe una clave secreta
            String existingSecretKey = user.getTwoFactorSecretKey();
            if (existingSecretKey != null && !existingSecretKey.isEmpty()) {
                return ResponseEntity.ok(Map.of(MESSAGE, "2FA ya está habilitado", "secretKey", existingSecretKey));
            }

            // Generar nueva clave secreta
            GoogleAuthenticator gAuth = new GoogleAuthenticator();
            GoogleAuthenticatorKey key = gAuth.createCredentials();
            user.setTwoFactorSecretKey(key.getKey());
            userRepository.save(user);

            // Generar enlace para Google Authenticator
            String appName = "ESIMEDIA";
            String qrCodeUrl = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s",
                appName, email, key.getKey(), appName
            );

            // Generar código QR como base64
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrCodeUrl, BarcodeFormat.QR_CODE, 300, 300);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            String base64QrCode = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());

            // Devolver QR en base64 y clave secreta
            return ResponseEntity.ok(Map.of("qrCodeBase64", base64QrCode, "secretKey", key.getKey()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR, "Error al generar el código QR: " + e.getMessage()));
        }
    }



    private java.util.Optional<User> findUserByEmail(String email) {
        var opt = userRepository.findById(email);
        if (opt.isEmpty()) {
            for (User u : userRepository.findAll()) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) {
                    return java.util.Optional.of(u);
                }
            }
        }
        return opt;
    }

    private void updateUserFields(User existing, Map<String, Object> body) {
        if (body.containsKey("name") && body.get("name") instanceof String) {
            existing.setName(((String) body.get("name")).trim());
        }
        if (body.containsKey(SURNAME) && body.get(SURNAME) instanceof String) {
            existing.setSurname(((String) body.get(SURNAME)).trim());
        }
        if (body.containsKey(ALIAS) && body.get(ALIAS) instanceof String) {
            existing.setAlias(((String) body.get(ALIAS)).trim());
        }
        if (body.containsKey(PICTURE) && body.get(PICTURE) instanceof String) {
            existing.setPicture(((String) body.get(PICTURE)).trim());
        }
        if (body.containsKey(ACTIVE)) {
            updateActiveField(existing, body.get(ACTIVE));
        }
    }

    private void updateActiveField(User existing, Object activeObj) {
        if (activeObj instanceof Boolean) {
            existing.setActive((Boolean) activeObj);
        } else {
            existing.setActive(Boolean.parseBoolean(String.valueOf(activeObj)));
        }
    }

    @DeleteMapping("/{email:.+}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> deleteUser(@PathVariable String email) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String authenticatedEmail = auth.getName();
        
        // Solo permitir si es el mismo usuario
        if (!authenticatedEmail.equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(ERROR, "Solo puedes eliminar tu propia cuenta"));
        }
        
        var opt = findUserByEmail(email);
        return opt.map(existing -> {
            userRepository.delete(existing);
            return ResponseEntity.ok(Map.of(MESSAGE, "Cuenta eliminada correctamente"));
        }).orElse(ResponseEntity.status(404).body(Map.of(ERROR, USUARIONOENCONTRADO)));
    }

    @PostMapping("/vip/upgrade")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> upgradeToVip() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(USUARIONOENCONTRADO);
        }

        user.setVip(true);
        user.setVipSince(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(MESSAGE, "Usuario actualizado a VIP", "vip", true));
    }

    @PostMapping("/vip/downgrade")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> downgradeFromVip() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(USUARIONOENCONTRADO);
        }

        user.setVip(false);
        user.setVipSince(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            MESSAGE, "Usuario actualizado a NORMAL. El contenido VIP permanecerá en tus listas pero no podrás acceder hasta que vuelvas a ser VIP", 
            "vip", false
        ));
    }
    
    private void createFavoritosPlaylist(String userEmail) {
        try {
            Playlist favoritos = new Playlist();
            favoritos.setNombre("Favoritos");
            favoritos.setDescripcion("Lista permanente de favoritos");
            favoritos.setUserEmail(userEmail);
            favoritos.setIsPermanent(true);
            favoritos.setCreatedAt(LocalDateTime.now());
            favoritos.setUpdatedAt(LocalDateTime.now());
            favoritos.setItems(new ArrayList<>());
            playlistRepository.save(favoritos);
        } catch (Exception e) {
            System.err.println("Error creating Favoritos playlist for user " + userEmail + ": " + e.getMessage());
        }
    }

    // Método helper para convertir User -> UserResponseDTO
    private UserResponseDTO toUserResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setSurname(user.getSurname());
        dto.setAlias(user.getAlias());
        dto.setPicture(user.getPicture());
        dto.setVip(user.isVip());
        // Convertir String a LocalDate si es necesario
        if (user.getDateOfBirth() != null) {
            dto.setDateOfBirth(LocalDate.parse(user.getDateOfBirth()));
        }
        return dto;
    }
}