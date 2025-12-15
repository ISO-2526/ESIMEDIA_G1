package grupo1.esimedia.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
// ✅ Reemplazado @ControllerAdvice por @RestControllerAdvice
import org.springframework.web.bind.annotation.RestControllerAdvice; 
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException; // ✅ Importar ResponseStatusException (es común en APIs)

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors; // ✅ Importar Collectors para simplificar el manejo de validación

/**
 * Global Exception Handler para manejar excepciones a nivel de API REST.
 * Proporciona respuestas consistentes en formato JSON.
 */
@RestControllerAdvice // ✅ CAMBIO CLAVE: Combina @ControllerAdvice y @ResponseBody
public class GlobalExceptionHandler {

    // --- Manejo de Excepciones de Negocio (Validación de DTOs) ---

    /**
     * Maneja errores de validación (@Valid) de los DTOs.
     * Devuelve una respuesta JSON con el primer mensaje de error y el detalle de los campos.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        
        // Recopilar todos los errores de validación usando Streams
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                    error -> error.getField(),
                    error -> error.getDefaultMessage(),
                    // Estrategia de merge si hay errores duplicados (mantener el primero)
                    (existing, replacement) -> existing
                ));
        
        // Obtener el primer error para el mensaje principal
        String firstError = fieldErrors.values().iterator().hasNext() 
                ? fieldErrors.values().iterator().next() 
                : "Error de validación desconocido";
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", firstError);
        response.put("fields", fieldErrors);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // --- Manejo de Excepciones de Spring WebServer ---

    /**
     * Maneja las excepciones comunes lanzadas con un código HTTP específico.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", ex.getStatusCode().value());
        body.put("error", ex.getReason());
        body.put("message", ex.getReason());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    /**
     * Maneja excepciones de IllegalArgumentException.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Invalid Argument");
        body.put("message", ex.getMessage());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    // --- Manejo de Excepciones Genéricas (Fallback) ---

    /**
     * Maneja excepciones genéricas no capturadas (Fallback).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", ex.getClass().getSimpleName());
        body.put("message", "Internal server error occurred: " + ex.getMessage());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}