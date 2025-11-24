package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.model.Playlist;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.PlaylistRepository;
import grupo1.esimedia.Accounts.service.EmailService;
import grupo1.esimedia.utils.PasswordUtils; // ✅ AGREGAR
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Map;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
// ❌ ELIMINAR: import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.CookieValue;

import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContentCreatorRepository contentCreatorRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    // ✅ AGREGAR PasswordUtils
    @Autowired
    private PasswordUtils passwordUtils;
    
    @Autowired
    private PlaylistRepository playlistRepository;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private TokenRepository tokenRepository;

    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (userRepository.existsById(user.getEmail()) || 
            contentCreatorRepository.existsById(user.getEmail()) || 
            adminRepository.existsById(user.getEmail())) {
            return ResponseEntity.status(400).body("Error al crear cuenta.");
        }

        // ✅ VALIDAR CONTRASEÑA CON DICCIONARIO + INFORMACIÓN PERSONAL
        List<String> passwordErrors = passwordUtils.validatePasswordPersonalInfo(
            user.getPassword(),
            user.getEmail(),
            user.getName(),
            user.getSurname(),
            user.getAlias()
        );
        
        if (!passwordErrors.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "PASSWORD_WEAK",
                "message", passwordErrors.get(0)
            ));
        }

        // Hashear contraseña
        user.setPassword(passwordUtils.hashPassword(user.getPassword()));

        // Guardar el usuario en la base de datos
        User saved = userRepository.save(user);
        
        // Crear automáticamente la lista "Favoritos" para el nuevo usuario
        createFavoritosPlaylist(user.getEmail());
        
        saved.setPassword(null); // No devolver la contraseña en la respuesta

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping(path = "", produces = "application/json")
    public ResponseEntity<java.util.List<User>> getAllUsers() {
        java.util.List<User> users = userRepository.findAll();
        for (User u : users) { if (u != null) u.setPassword(null); }
        return ResponseEntity.ok(users);
    }

    @GetMapping(path = "/{email:.+}", produces = "application/json")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email, @CookieValue(value = "access_token", required = false) String tokenId) {
        // permitir solo admin vía token cookie
        Token token = requireValidToken(tokenId);
        if (token == null || token.getRole() == null || !"admin".equals(token.getRole())) {
            return ResponseEntity.status(401).build();
        }
        var opt = userRepository.findById(email);
        if (opt.isEmpty()) {
            for (User u : userRepository.findAll()) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(u); break; }
            }
        }
        return opt.map(u -> { u.setPassword(null); return ResponseEntity.ok(u); }).orElse(ResponseEntity.status(404).build());
    }

    @PutMapping(path = "/{email:.+}/active", consumes = "application/json")
    public ResponseEntity<?> setUserActive(@PathVariable String email, @RequestBody java.util.Map<String, Object> body, @CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null || token.getRole() == null || !"admin".equals(token.getRole())) return ResponseEntity.status(401).build();
        Object activeObj = body.get("active");
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
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.status(404).build());
    }

    @PutMapping(path = "/{email:.+}", consumes = "application/json")
    public ResponseEntity<?> updateUser(@PathVariable String email, @RequestBody java.util.Map<String, Object> body, @CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null || token.getRole() == null || !"admin".equals(token.getRole())) {
            return ResponseEntity.status(401).build();
        }

        var opt = findUserByEmail(email);
        
        return opt.map(existing -> {
            updateUserFields(existing, body);
            User saved = userRepository.save(existing);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.status(404).build());
    }

    // Get user favorites
    @GetMapping(path = "/favorites", produces = "application/json")
    public ResponseEntity<java.util.List<String>> getUserFavorites(@CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(401).build();
        String userEmail = token.getAccountId();
        
        System.out.println("Fetching favorites for user: " + userEmail);
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            System.out.println("User not found: " + userEmail);
            return ResponseEntity.status(404).build();
        }
        
        User user = opt.get();
        java.util.List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new java.util.ArrayList<>();
        }
        
        System.out.println("User favorites count: " + favorites.size());
        
        return ResponseEntity.ok(favorites);
    }

    // Add content to favorites
    @PostMapping(path = "/favorites/{contentId}")
    public ResponseEntity<?> addToFavorites(@PathVariable String contentId, @CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(401).build();
        String userEmail = token.getAccountId();
        
        System.out.println("Adding to favorites - User: " + userEmail + ", Content: " + contentId);
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            System.out.println("User not found, creating new user: " + userEmail);
            // Create user if doesn't exist
            User newUser = new User();
            newUser.setEmail(userEmail);
            newUser.setFavorites(new java.util.ArrayList<>());
            newUser.getFavorites().add(contentId);
            userRepository.save(newUser);
            System.out.println("New user created with first favorite");
            return ResponseEntity.ok(java.util.Map.of("message", "Added to favorites", "favorites", newUser.getFavorites()));
        }
        
        User user = opt.get();
        java.util.List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new java.util.ArrayList<>();
        }
        
        // Check if already in favorites
        if (favorites.contains(contentId)) {
            System.out.println("Content already in favorites");
            return ResponseEntity.status(400).body(java.util.Map.of("error", "Content already in favorites"));
        }
        
        favorites.add(contentId);
        user.setFavorites(favorites);
        userRepository.save(user);
        
        System.out.println("Favorite added successfully. Total favorites: " + favorites.size());
        
        return ResponseEntity.ok(java.util.Map.of("message", "Added to favorites", "favorites", favorites));
    }

    // Remove content from favorites
    @DeleteMapping(path = "/favorites/{contentId}")
    public ResponseEntity<?> removeFromFavorites(@PathVariable String contentId, @CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(401).build();
        String userEmail = token.getAccountId();
        
        var opt = userRepository.findById(userEmail);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        User user = opt.get();
        java.util.List<String> favorites = user.getFavorites();
        if (favorites == null) {
            favorites = new java.util.ArrayList<>();
        }
        
        favorites.remove(contentId);
        user.setFavorites(favorites);
        userRepository.save(user);
        
        return ResponseEntity.ok(java.util.Map.of("message", "Removed from favorites", "favorites", favorites));
    }
    //Reset password functionality(obsoleto)
    @PostMapping(path = "/reset-password", consumes = "application/json")
    public ResponseEntity<?> recoverPassword(@RequestBody java.util.Map<String, Object> body) {
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

        if (user.getTokenExpiration() == null || user.getTokenExpiration().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(400).body("Token expired");
        }

        //Set the password from the inputs of the method
        password = passwordUtils.hashPassword(password);
        user.setPassword(password);
        user.setResetToken(null);
        user.setTokenExpiration(null);
        emailService.sendEmail(user.getEmail(), "Password Reset", "Your password has been reset successfully.");
        userRepository.save(user);

        

        return ResponseEntity.ok(java.util.Map.of("message", "Password reset"));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        String email = token.getAccountId();

        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
        user.setPassword(null); // No devolver la contraseña
        return ResponseEntity.ok(user);
    }

    @PutMapping("/editUser")
    public ResponseEntity<?> editUser(@CookieValue(value = "access_token", required = false) String tokenId, @RequestBody User updatedUser) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        String email = token.getAccountId();

        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        // Actualizar los campos permitidos
        user.setName(updatedUser.getName());
        user.setSurname(updatedUser.getSurname());
        user.setAlias(updatedUser.getAlias());
        user.setPicture(updatedUser.getPicture());

        userRepository.save(user);
        user.setPassword(null); // No devolver la contraseña
        return ResponseEntity.ok(user);
    }   

    @GetMapping("/2fa/setup")
    public ResponseEntity<Map<String, String>> setupTwoFactorAuth(@RequestParam String email) {
        // Validar formato del correo electrónico
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Correo electrónico inválido"));
        }

        // Buscar usuario
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }

        try {
            // Verificar si ya existe una clave secreta
            String existingSecretKey = user.getTwoFactorSecretKey();
            if (existingSecretKey != null && !existingSecretKey.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "2FA ya está habilitado", "secretKey", existingSecretKey));
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
                .body(Map.of("error", "Error al generar el código QR: " + e.getMessage()));
        }
    }

    private Token requireValidToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return null;
        Token token = tokenRepository.findById(tokenId).orElse(null);
        if (token == null) return null;
        if (token.getExpiration() == null || token.getExpiration().isBefore(LocalDateTime.now())) return null;
        return token;
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

    private void updateUserFields(User existing, java.util.Map<String, Object> body) {
        if (body.containsKey("name") && body.get("name") instanceof String) {
            existing.setName(((String) body.get("name")).trim());
        }
        if (body.containsKey("surname") && body.get("surname") instanceof String) {
            existing.setSurname(((String) body.get("surname")).trim());
        }
        if (body.containsKey("alias") && body.get("alias") instanceof String) {
            existing.setAlias(((String) body.get("alias")).trim());
        }
        if (body.containsKey("picture") && body.get("picture") instanceof String) {
            existing.setPicture(((String) body.get("picture")).trim());
        }
        if (body.containsKey("active")) {
            updateActiveField(existing, body.get("active"));
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
    public ResponseEntity<?> deleteUser(@PathVariable String email) {

        var opt = findUserByEmail(email);

        return opt.map(existing -> {
            userRepository.delete(existing);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.status(404).build());
    }

    // VIP Upgrade endpoint
    @PostMapping("/vip/upgrade")
    public ResponseEntity<?> upgradeToVip(@CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        String email = token.getAccountId();

        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        user.setVip(true);
        user.setVipSince(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Usuario actualizado a VIP", "vip", true));
    }

    // VIP Downgrade endpoint - also cleans VIP content from playlists
    @PostMapping("/vip/downgrade")
    public ResponseEntity<?> downgradeFromVip(@CookieValue(value = "access_token", required = false) String tokenId) {
        Token token = requireValidToken(tokenId);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        String email = token.getAccountId();

        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        // Update user to non-VIP
        user.setVip(false);
        user.setVipSince(null);
        userRepository.save(user);

        // NOTE: We NO longer remove VIP content from playlists
        // Instead, the frontend will show a special cover image for VIP content
        // This allows users to see what VIP content they had and regain access if they upgrade again

        return ResponseEntity.ok(Map.of(
            "message", "Usuario actualizado a NORMAL. El contenido VIP permanecerá en tus listas pero no podrás acceder hasta que vuelvas a ser VIP", 
            "vip", false
        ));
    }
    
    // Helper method to create Favoritos playlist for new users
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
            // Log error but don't fail user creation
            System.err.println("Error creating Favoritos playlist for user " + userEmail + ": " + e.getMessage());
        }
    }
}
