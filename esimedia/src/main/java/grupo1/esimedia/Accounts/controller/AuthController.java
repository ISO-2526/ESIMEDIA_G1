package grupo1.esimedia.Accounts.controller;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import grupo1.esimedia.Accounts.model.Admin;
import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.AdminRepository;
import grupo1.esimedia.Accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Accounts.service.EmailService;
import grupo1.esimedia.Accounts.service.ThreeFactorAuthService;
import grupo1.esimedia.Accounts.service.TwoFactorAuthService;
import grupo1.esimedia.security.LoginAttemptService;
import grupo1.esimedia.security.RateLimitService;
import grupo1.esimedia.utils.PasswordUtils;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    private final EmailService emailService;
    private final PasswordUtils passwordUtils;
    private final LoginAttemptService loginAttemptService;
    private final AdminRepository adminRepository;
    private final ContentCreatorRepository contentCreatorRepository;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final TwoFactorAuthService twoFactorAuthService;
    private final ThreeFactorAuthService threeFactorAuthService;
    private final RateLimitService rateLimitService;

    public AuthController(
            AdminRepository adminRepository, 
            ContentCreatorRepository contentCreatorRepository, 
            UserRepository userRepository, 
            TokenRepository tokenRepository, 
            TwoFactorAuthService twoFactorAuthService, 
            ThreeFactorAuthService threeFactorAuthService,
            EmailService emailService,
            PasswordUtils passwordUtils,
            RateLimitService rateLimitService,
            LoginAttemptService loginAttemptService) {
        this.adminRepository = adminRepository;
        this.contentCreatorRepository = contentCreatorRepository;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.twoFactorAuthService = twoFactorAuthService;
        this.threeFactorAuthService = threeFactorAuthService;
        this.emailService = emailService;
        this.passwordUtils = passwordUtils;
        this.loginAttemptService = loginAttemptService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping(path = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        String password = body.get("password");
        
        // Validación básica
        if (email == null || password == null) {
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("error", "Email y contraseña son requeridos");
            return ResponseEntity.badRequest().body(errorResp);
        }

        // Trim inputs
        email = email.trim();
        password = password.trim();
        String rawTwoFactor = body.get("2fa_code");
        boolean hasTwoFactorCode = rawTwoFactor != null && !rawTwoFactor.trim().isEmpty();
        if (hasTwoFactorCode) {
            body.put("2fa_code", rawTwoFactor.trim());
        }
        
        String clientIp = getClientIp(request);

        log.info("[AUTH] Login attempt: email='{}' from IP={}", email, clientIp);
        
        // Rate limiting: 5 intentos / 5 min
        if (!hasTwoFactorCode && !rateLimitService.allowLogin(clientIp, email)) {
            emailService.sendRateLimitExceededEmail(email);
            return ResponseEntity.status(429)
                .body("Demasiados intentos de login. Intenta de nuevo en 5 minutos.");
        }

        // VERIFICAR SI ESTÁ BLOQUEADO (POR EMAIL + IP)
        if (loginAttemptService.isLocked(email, clientIp)) {
            long lockoutTime = loginAttemptService.getLockoutTime(email, clientIp);
            String message = String.format(
                "Demasiados intentos fallidos desde esta IP. Intenta de nuevo en %d minutos.",
                (lockoutTime / 60) + 1
            );
            
            log.warn("[SECURITY] Login blocked for: {} from IP: {} - Account locked", email, clientIp);
            
            Map<String, Object> lockedResp = new HashMap<>();
            lockedResp.put("error", message);
            lockedResp.put("locked", true);
            lockedResp.put("lockoutTime", lockoutTime);
            return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(lockedResp);
        }

        // DETECTAR ATAQUE DISTRIBUIDO
        if (loginAttemptService.isDistributedAttack(email)) {
            log.error("🚨 DISTRIBUTED ATTACK: Email '{}' under attack from multiple IPs. Current IP: {}", 
                     email, clientIp);
        }

        // Hash ficticio para comparación constante en tiempo
        String dummyHash = "$2a$12$dummyHashParaEvitarTimingAttacks1234567890ABC";

        // Try admin login
        ResponseEntity<?> adminResponse = tryAdminLogin(email, password, body, clientIp, dummyHash);
        if (adminResponse != null) return adminResponse;

        // Try creator login
        ResponseEntity<?> creatorResponse = tryCreatorLogin(email, password, body, clientIp, dummyHash);
        if (creatorResponse != null) return creatorResponse;

        // Try user login
        ResponseEntity<?> userResponse = tryUserLogin(email, password, body, clientIp, dummyHash);
        if (userResponse != null) return userResponse;

        // USUARIO NO ENCONTRADO
        passwordUtils.verifyPassword(password, dummyHash);
        
        loginAttemptService.recordFailedAttempt(email, clientIp);
        int remaining = loginAttemptService.getRemainingAttempts(email, clientIp);
        
        log.warn("[AUTH] Failed login - user not found: {} from IP: {} - Remaining attempts: {}", 
                 email, clientIp, remaining);
        
        Map<String, Object> errorResp = new HashMap<>();
        errorResp.put("error", "Credenciales inválidas");
        if (remaining > 0) {
            errorResp.put("remainingAttempts", remaining);
        }
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(errorResp);
    }

    private ResponseEntity<?> tryAdminLogin(String email, String password, Map<String, String> body, String clientIp, String dummyHash) {
        var adminOpt = findAdminByEmailIgnoreCase(email);
        if (adminOpt.isEmpty()) return null;

        Admin admin = adminOpt.get();
        log.info("[AUTH] Found admin for email='{}'", admin.getEmail());

        if (!admin.isActive()) {
            return inactiveAccountResponse();
        }

        if (!passwordUtils.verifyPassword(password, admin.getPassword())) {
            return invalidCredentialsResponse(email, clientIp, "admin");
        }

        ResponseEntity<?> twoFa = enforceTwoFactorIfNeeded(admin.getEmail(), "admin", admin.getTwoFactorSecretKey(), body, clientIp);
        if (twoFa != null) return twoFa;

        ResponseEntity<?> threeFa = enforceThirdFactorIfEnabled(admin.isThirdFactorEnabled(), admin.getEmail(), "admin");
        if (threeFa != null) return threeFa;

        loginAttemptService.resetAttempts(email, clientIp);
        return buildLoginSuccessResponseForAdmin(admin, email, clientIp);
    }

    private ResponseEntity<?> tryCreatorLogin(String email, String password, Map<String, String> body, String clientIp, String dummyHash) {
        var creatorOpt = findCreatorByEmailIgnoreCase(email);
        if (creatorOpt.isEmpty()) return null;

        ContentCreator creator = creatorOpt.get();
        log.info("[AUTH] Found creator for email='{}'", creator.getEmail());

        if (!creator.isActive()) {
            return inactiveAccountResponse();
        }

        if (!passwordUtils.verifyPassword(password, creator.getPassword())) {
            return invalidCredentialsResponse(email, clientIp, "creator");
        }

        ResponseEntity<?> twoFa = enforceTwoFactorIfNeeded(creator.getEmail(), "creator", creator.getTwoFactorSecretKey(), body, clientIp);
        if (twoFa != null) return twoFa;

        ResponseEntity<?> threeFa = enforceThirdFactorIfEnabled(creator.isThirdFactorEnabled(), creator.getEmail(), "creator");
        if (threeFa != null) return threeFa;

        loginAttemptService.resetAttempts(email, clientIp);
        return buildLoginSuccessResponseForCreator(creator, email, clientIp);
    }

    private ResponseEntity<?> tryUserLogin(String email, String password, Map<String, String> body, String clientIp, String dummyHash) {
        var userOpt = findUserByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) return null;

        User user = userOpt.get();
        log.info("[AUTH] Found user for email='{}'", user.getEmail());

        if (!passwordUtils.verifyPassword(password, user.getPassword())) {
            return invalidCredentialsResponse(email, clientIp, "user");
        }

        ResponseEntity<?> twoFa = enforceTwoFactorIfNeeded(user.getEmail(), "user", user.getTwoFactorSecretKey(), body, clientIp);
        if (twoFa != null) return twoFa;

        if (!user.isActive()) {
            return inactiveAccountResponse();
        }

        ResponseEntity<?> threeFa = enforceThirdFactorIfEnabled(user.isThirdFactorEnabled(), user.getEmail(), "user");
        if (threeFa != null) return threeFa;

        loginAttemptService.resetAttempts(email, clientIp);
        return buildLoginSuccessResponseForUser(user, email, clientIp);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If X-Forwarded-For contains multiple IPs, get the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    // Recover password
    @PostMapping(path = "/recover", consumes = "application/json")
    public ResponseEntity<?> recoverPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email es requerido");
        }

        // ✅ Rate limiting: 3 envíos/hora, 10/día
        if (!rateLimitService.allowOtpHourly(email)) {
            log.warn("Rate limit excedido (hora) para reset password: {}", email);
            emailService.sendRateLimitExceededEmail(email);
            return ResponseEntity.status(429)
                .body("Demasiados intentos. Puedes solicitar máximo 3 códigos por hora.");
        }
        
        if (!rateLimitService.allowOtpDaily(email)) {
            log.warn("Rate limit excedido (día) para reset password: {}", email);
            emailService.sendRateLimitExceededEmail(email);
            return ResponseEntity.status(429)
                .body("Límite diario excedido. Puedes solicitar máximo 10 códigos por día.");
        }

        var opt = userRepository.findById(email);
        if (opt.isEmpty()) {
            for (User u : userRepository.findAll()) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) { opt = java.util.Optional.of(u); break; }
            }
        }
        if (opt.isPresent()) {
            User user = opt.get();
            String token= java.util.UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setTokenExpiration(java.time.LocalDateTime.now().plusMinutes(15)); // token valid for 15 minutes
            userRepository.save(user);
            // Send the user a link to reset their password
            String resetLink = "http://localhost:3000/reset-password?token=" + user.getResetToken();
            String subject = "Recuperación de contraseña";
            String bodyEmail = "Hola " + user.getName() + ",\n\n" +
                    "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.\n" +
                    "Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:\n" +
                    resetLink + "\n" + "Este enlace es válido por 15 minutos." + "\n" +
                    "Si no solicitaste este cambio, puedes ignorar este correo electrónico.\n\n" +
                    "Saludos,\nEl equipo de ESIMEDIA";
            
            emailService.sendEmail(user.getEmail(), subject, bodyEmail);


            return ResponseEntity.ok("Se ha enviado un correo de recuperación a " + email);
        } else {
            return ResponseEntity.status(404).body("Error: Usuario no encontrado.");
        }
    }

    // Validate reset token
    @GetMapping(path = "/validate-reset-token", produces = "application/json")
    public ResponseEntity<Map<String, Boolean>> validateResetToken(@RequestParam String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = userRepository.findByResetToken(token);
        boolean isValid = (user != null && user.getTokenExpiration() != null && user.getTokenExpiration().isAfter(java.time.LocalDateTime.now()));
        //printea el token y si es valido

        System.out.println("Validating token: " + token + " isValid: " + isValid);
        Map<String, Boolean> resp = new HashMap<>();
        resp.put("valid", isValid);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/protected-resource")
    public ResponseEntity<?> getProtectedResource(
            @CookieValue(value = "access_token", required = false) String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token no proporcionado");
        }
        Token token = tokenRepository.findById(tokenId).orElse(null);
        if (token == null || token.getExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido o expirado");
        }
        return ResponseEntity.ok("Recurso protegido accedido correctamente");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "access_token", required = false) String tokenId,
            @CookieValue(value = "csrf_token", required = false) String csrfCookie,
            @RequestHeader(value = "X-CSRF-Token", required = false) String csrfHeader) {

        if (csrfCookie == null || csrfHeader == null || !csrfCookie.equals(csrfHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("CSRF inválido");
        }

        if (tokenId != null && !tokenId.isBlank()) {
            Token token = tokenRepository.findById(tokenId).orElse(null);
            if (token != null) tokenRepository.delete(token);
        }

        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
                .httpOnly(true).secure(true).sameSite("Strict").path("/").maxAge(0).build();
        ResponseCookie clearCsrf = ResponseCookie.from("csrf_token", "")
                .httpOnly(false).secure(true).sameSite("Strict").path("/").maxAge(0).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccess.toString())
                .header(HttpHeaders.SET_COOKIE, clearCsrf.toString())
                .body("Sesión cerrada correctamente");
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(
            @CookieValue(value = "access_token", required = false) String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token no proporcionado");
        }
        System.out.println("Validating token (cookie): " + tokenId);

        Token token = tokenRepository.findById(tokenId).orElse(null);
        if (token == null || token.getExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido o expirado");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("role", token.getRole());
        response.put("email", token.getAccountId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/2fa/setup")
    public ResponseEntity<Map<String, String>> setupTwoFactorAuth(@RequestParam String email) {
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }

        // Generar clave secreta
        String secretKey = twoFactorAuthService.generateSecretKey();
        user.setTwoFactorSecretKey(secretKey);
        userRepository.save(user);

        // Generar enlace para Google Authenticator
        String appName = "ESIMEDIA";
        String qrCodeUrl = String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s",
            appName, email, secretKey, appName
        );

        return ResponseEntity.ok(Map.of("qrCodeUrl", qrCodeUrl, "secretKey", secretKey));
    }

    public String generateQRCode(String qrCodeUrl) throws WriterException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(qrCodeUrl, BarcodeFormat.QR_CODE, 300, 300);

        String filePath = "qrCode.png";
        Path path = FileSystems.getDefault().getPath(filePath);
        try {
            MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);
        } catch (IOException e) {
            log.error("Error generating QR code file", e);
            throw new RuntimeException("Error generating QR code file", e);
        }

        return filePath; // Devuelve la ruta del archivo generado
    }

    @PostMapping("/activate-3fa")
    public ResponseEntity<?> activateThirdFactor(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        boolean activate = Boolean.parseBoolean(body.get("activate"));

        var adminOpt = adminRepository.findById(email);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            admin.setThirdFactorEnabled(activate);
            adminRepository.save(admin);
        }
        var creatorOpt = contentCreatorRepository.findById(email);
        if (creatorOpt.isPresent()) {
            ContentCreator creator = creatorOpt.get();
            creator.setThirdFactorEnabled(activate);
            contentCreatorRepository.save(creator);
        }
        var userOpt = userRepository.findById(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setThirdFactorEnabled(activate);
            userRepository.save(user);
        }

        String message = activate ? "Tercer factor activado correctamente." : "Tercer factor desactivado correctamente.";
        return ResponseEntity.ok(message);
    }

    @PostMapping("/send-3fa-code")
    public ResponseEntity<?> sendThirdFactorCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("El correo electrónico es obligatorio.");
        }

        // Generar el código de verificación
        String verificationCode = threeFactorAuthService.generateVerificationCode(email);

        // Enviar el correo electrónico
        try {
            emailService.sendEmail(
                email,
                "Código de Verificación (3FA)",
                "Hola.\n\n" +
                "Has solicitado activar la autenticación de tercer factor (3FA) en tu cuenta. " +
                "Por favor, utiliza el siguiente código para completar la activación:\n\n" +
                "Código de Activación: "+ verificationCode + "\n"+ "Este código es válido por 10 minutos." +"\n" 
                + "Si solicita un reenvío, el código anterior será invalidado" +
                "Si no solicitaste esta activación, ignora este correo.\n\n" +
                "Atentamente,\nEl equipo de ESIMEDIA"
            );
            return ResponseEntity.ok("Código enviado al correo electrónico.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al enviar el correo.");
        }
    }

    @PostMapping("/verify-3fa-code")
    public ResponseEntity<?> verifyThirdFactorCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body("El correo y el código son obligatorios.");
        }

        boolean valid = threeFactorAuthService.validateVerificationCode(email, code);
        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Código inválido o expirado.");
        }

        // Admin
        var adminOpt = findAdminByEmailIgnoreCase(email);
        if (adminOpt.isPresent()) {
            return build3FASuccessResponseForAdmin(adminOpt.get());
        }

        // Content creator
        var creatorOpt = findCreatorByEmailIgnoreCase(email);
        if (creatorOpt.isPresent()) {
            return build3FASuccessResponseForCreator(creatorOpt.get());
        }

        // User
        var userOpt = findUserByEmailIgnoreCase(email);
        if (userOpt.isPresent()) {
            return build3FASuccessResponseForUser(userOpt.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cuenta no encontrada");
    }

    @PostMapping(path = "/reset-password", consumes = "application/json")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, Object> body) {
        String token = (String) body.get("token");
        String password = (String) body.get("password");
        LocalDateTime now = LocalDateTime.now();

        // 1. User
        User user = userRepository.findByResetToken(token);
        if (user != null) {
            ResponseEntity<?> resp = handlePasswordResetForUser(user, password, now);
            if (resp != null) return resp;
            return ResponseEntity.ok("Contraseña restablecida");
        }

        // 2. Admin
        Admin admin = adminRepository.findByResetToken(token);
        if (admin != null) {
            ResponseEntity<?> resp = handlePasswordResetForAdmin(admin, password, now);
            if (resp != null) return resp;
            return ResponseEntity.ok("Contraseña restablecida");
        }

        // 3. ContentCreator
        ContentCreator creator = contentCreatorRepository.findByResetToken(token);
        if (creator != null) {
            ResponseEntity<?> resp = handlePasswordResetForCreator(creator, password, now);
            if (resp != null) return resp;
            return ResponseEntity.ok("Contraseña restablecida");
        }

        return ResponseEntity.status(400).body("Token inválido");
    }

    // ---------- Helpers para reducir complejidad ----------

    private java.util.Optional<Admin> findAdminByEmailIgnoreCase(String email) {
        var adminOpt = adminRepository.findById(email);
        if (adminOpt.isEmpty()) {
            for (Admin a : adminRepository.findAll()) {
                if (a.getEmail() != null && a.getEmail().equalsIgnoreCase(email)) {
                    return java.util.Optional.of(a);
                }
            }
        }
        return adminOpt;
    }

    private java.util.Optional<ContentCreator> findCreatorByEmailIgnoreCase(String email) {
        var creatorOpt = contentCreatorRepository.findById(email);
        if (creatorOpt.isEmpty()) {
            for (ContentCreator c : contentCreatorRepository.findAll()) {
                if (c.getEmail() != null && c.getEmail().equalsIgnoreCase(email)) {
                    return java.util.Optional.of(c);
                }
            }
        }
        return creatorOpt;
    }

    private java.util.Optional<User> findUserByEmailIgnoreCase(String email) {
        var userOpt = userRepository.findById(email);
        if (userOpt.isEmpty()) {
            for (User u : userRepository.findAll()) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) {
                    return java.util.Optional.of(u);
                }
            }
        }
        return userOpt;
    }

    private ResponseEntity<?> inactiveAccountResponse() {
        Map<String, Object> errorResp = new HashMap<>();
        errorResp.put("error", "Cuenta inactiva");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResp);
    }

    private ResponseEntity<?> invalidCredentialsResponse(String email, String clientIp, String role) {
        loginAttemptService.recordFailedAttempt(email, clientIp);
        int remaining = loginAttemptService.getRemainingAttempts(email, clientIp);
        log.warn("[AUTH] Failed login for {}: {} from IP: {} - Remaining attempts: {}", role, email, clientIp, remaining);

        Map<String, Object> errorResp = new HashMap<>();
        errorResp.put("error", "Credenciales inválidas");
        if (remaining > 0) {
            errorResp.put("remainingAttempts", remaining);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResp);
    }

    private ResponseEntity<?> enforceTwoFactorIfNeeded(String accountEmail, String role, String secretKey, Map<String, String> body, String clientIp) {
        if (secretKey == null) return null;

        String codeStr = body.get("2fa_code");
        if (codeStr == null) {
            Map<String, Object> twoFactorResp = new HashMap<>();
            twoFactorResp.put("requiresTwoFactor", true);
            twoFactorResp.put("email", accountEmail);
            twoFactorResp.put("role", role);
            return ResponseEntity.status(428).body(twoFactorResp);
        }
        try {
            int code = Integer.parseInt(codeStr);
            if (!twoFactorAuthService.validateCode(secretKey, code)) {
                loginAttemptService.recordFailedAttempt(accountEmail, clientIp);
                Map<String, Object> errorResp = new HashMap<>();
                errorResp.put("error", "Código 2FA inválido");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResp);
            }
        } catch (NumberFormatException e) {
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("error", "Formato de código 2FA inválido");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResp);
        }
        return null;
    }

    private ResponseEntity<?> enforceThirdFactorIfEnabled(boolean enabled, String email, String role) {
        if (!enabled) return null;
        Map<String, Object> thirdFactorResp = new HashMap<>();
        thirdFactorResp.put("thirdFactorRequired", true);
        thirdFactorResp.put("email", email);
        thirdFactorResp.put("role", role);
        return ResponseEntity.status(428).body(thirdFactorResp);
    }

    private static final class TokenResult {
        final String tokenId;
        final ResponseCookie accessCookie;
        final ResponseCookie csrfCookie;
        TokenResult(String tokenId, ResponseCookie accessCookie, ResponseCookie csrfCookie) {
            this.tokenId = tokenId; this.accessCookie = accessCookie; this.csrfCookie = csrfCookie;
        }
    }

    private TokenResult createTokenAndCookies(String accountId, String role) {
        String tokenID = UUID.randomUUID().toString();
        Token token = new Token();
        token.setId(tokenID);
        token.setAccountId(accountId);
        token.setRole(role);
        token.setExpiration(LocalDateTime.now().plusHours(8));
        tokenRepository.save(token);

        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokenID)
            .httpOnly(true).secure(true).sameSite("Strict").path("/").maxAge(Duration.ofHours(2)).build();
        ResponseCookie csrfCookie = ResponseCookie.from("csrf_token", UUID.randomUUID().toString())
            .httpOnly(false).secure(true).sameSite("Strict").path("/").maxAge(Duration.ofHours(2)).build();

        return new TokenResult(tokenID, accessCookie, csrfCookie);
    }

    private ResponseEntity<?> buildLoginSuccessResponseForAdmin(Admin admin, String email, String clientIp) {
        TokenResult tr = createTokenAndCookies(admin.getEmail(), "admin");
        Map<String, Object> resp = new HashMap<>();
        resp.put("role", "admin");
        resp.put("email", admin.getEmail());
        resp.put("picture", admin.getPicture());
        resp.put("thirdFactorEnabled", admin.isThirdFactorEnabled());

        log.info("[AUTH] ✓ Login successful for admin: {} from IP: {}", email, clientIp);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> buildLoginSuccessResponseForCreator(ContentCreator creator, String email, String clientIp) {
        TokenResult tr = createTokenAndCookies(creator.getEmail(), "creator");
        Map<String, Object> resp = new HashMap<>();
        resp.put("role", "creator");
        resp.put("email", creator.getEmail());
        resp.put("alias", creator.getAlias());
        resp.put("picture", creator.getPicture());
        resp.put("thirdFactorEnabled", creator.isThirdFactorEnabled());

        log.info("[AUTH] ✓ Login successful for creator: {} from IP: {}", email, clientIp);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> buildLoginSuccessResponseForUser(User user, String email, String clientIp) {
        TokenResult tr = createTokenAndCookies(user.getEmail(), "user");
        Map<String, Object> resp = new HashMap<>();
        resp.put("role", "user");
        resp.put("email", user.getEmail());
        resp.put("picture", user.getPicture());
        resp.put("thirdFactorEnabled", user.isThirdFactorEnabled());

        log.info("[AUTH] ✓ Login successful for user: {} from IP: {}", email, clientIp);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> build3FASuccessResponseForAdmin(Admin admin) {
        TokenResult tr = createTokenAndCookies(admin.getEmail(), "admin");
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", tr.tokenId);
        resp.put("role", "admin");
        resp.put("email", admin.getEmail());
        resp.put("picture", admin.getPicture());
        resp.put("thirdFactorEnabled", admin.isThirdFactorEnabled());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> build3FASuccessResponseForCreator(ContentCreator creator) {
        TokenResult tr = createTokenAndCookies(creator.getEmail(), "creator");
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", tr.tokenId);
        resp.put("role", "creator");
        resp.put("email", creator.getEmail());
        resp.put("alias", creator.getAlias());
        resp.put("picture", creator.getPicture());
        resp.put("thirdFactorEnabled", creator.isThirdFactorEnabled());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> build3FASuccessResponseForUser(User user) {
        TokenResult tr = createTokenAndCookies(user.getEmail(), "user");
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", tr.tokenId);
        resp.put("role", "user");
        resp.put("email", user.getEmail());
        resp.put("picture", user.getPicture());
        resp.put("thirdFactorEnabled", user.isThirdFactorEnabled());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, tr.accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, tr.csrfCookie.toString())
            .body(resp);
    }

    private ResponseEntity<?> handlePasswordResetForUser(User user, String password, LocalDateTime now) {
        if (isResetTokenExpired(user.getTokenExpiration(), now)) {
            return ResponseEntity.status(400).body("El token ha expirado");
        }
        String email = user.getEmail();
        String name = user.getName();
        String surname = user.getSurname();
        String alias = user.getAlias();

        var err = firstPersonalInfoError(password, email, name, surname, alias);
        if (err.isPresent()) {
            return ResponseEntity.status(400).body(err.get());
        }

        user.setPassword(passwordUtils.hashPassword(password));
        user.setResetToken(null);
        user.setTokenExpiration(null);
        userRepository.save(user);
        log.info("✅ Contraseña restablecida para Usuario: {}", email);
        return null; // caller devuelve 200 OK con mensaje
    }

    private ResponseEntity<?> handlePasswordResetForAdmin(Admin admin, String password, LocalDateTime now) {
        if (isResetTokenExpired(admin.getTokenExpiration(), now)) {
            return ResponseEntity.status(400).body("El token ha expirado");
        }
        String email = admin.getEmail();
        String name = admin.getName();
        String surname = admin.getSurname();
        String alias = null; // Admin no tiene alias

        var err = firstPersonalInfoError(password, email, name, surname, alias);
        if (err.isPresent()) {
            return ResponseEntity.status(400).body(err.get());
        }

        admin.setPassword(passwordUtils.hashPassword(password));
        admin.setResetToken(null);
        admin.setTokenExpiration(null);
        adminRepository.save(admin);
        log.info("✅ Contraseña restablecida para Admin: {}", email);
        return null;
    }

    private ResponseEntity<?> handlePasswordResetForCreator(ContentCreator creator, String password, LocalDateTime now) {
        if (isResetTokenExpired(creator.getTokenExpiration(), now)) {
            return ResponseEntity.status(400).body("El token ha expirado");
        }
        String email = creator.getEmail();
        String name = creator.getName();
        String surname = creator.getSurname();
        String alias = creator.getAlias();

        var err = firstPersonalInfoError(password, email, name, surname, alias);
        if (err.isPresent()) {
            return ResponseEntity.status(400).body(err.get());
        }

        creator.setPassword(passwordUtils.hashPassword(password));
        creator.setResetToken(null);
        creator.setTokenExpiration(null);
        contentCreatorRepository.save(creator);
        log.info("✅ Contraseña restablecida para Creador de Contenido: {}", email);
        return null;
    }

    private boolean isResetTokenExpired(LocalDateTime expiration, LocalDateTime now) {
        return expiration == null || expiration.isBefore(now);
    }

    private java.util.Optional<String> firstPersonalInfoError(String password, String email, String name, String surname, String alias) {
        java.util.List<String> errors = passwordUtils.validatePasswordPersonalInfo(password, email, name, surname, alias);
        if (errors == null || errors.isEmpty()) return java.util.Optional.empty();
        return java.util.Optional.of(errors.get(0));
    }
}