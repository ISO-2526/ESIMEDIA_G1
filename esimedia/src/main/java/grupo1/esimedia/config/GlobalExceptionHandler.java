package grupo1.esimedia.config;

import grupo1.esimedia.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Método que ya existía (y que ya usa Map<String, Object>)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        });
        
        String firstError = fieldErrors.values().iterator().hasNext() 
            ? fieldErrors.values().iterator().next() 
            : "Error de validación";
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", firstError);
        response.put("fields", fieldErrors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    // MÉTODO AÑADIDO: handleResourceNotFound
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.NOT_FOUND, 
            "Not Found", 
            ex.getMessage(), 
            request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // MÉTODO AÑADIDO: handleAccessDenied
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.FORBIDDEN, 
            "Forbidden", 
            "No tienes permiso para acceder a este recurso", 
            request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // MÉTODO AÑADIDO: handleIllegalArgument
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.BAD_REQUEST, 
            "Bad Request", 
            ex.getMessage(), 
            request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // MÉTODO AÑADIDO: handleGenericException
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(RuntimeException ex, HttpServletRequest request) {
        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR, 
            "Internal Server Error", 
            "Ha ocurrido un error inesperado. Por favor, inténtalo más tarde.", 
            request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Método auxiliar para crear el cuerpo de la respuesta de error, replicando la estructura esperada por la prueba
    private Map<String, Object> createErrorResponse(HttpStatus status, String error, String message, String path) {
        Map<String, Object> map = new HashMap<>();
        map.put("timestamp", LocalDateTime.now().toString());
        map.put("status", status.value());
        map.put("error", error);
        map.put("message", message);
        map.put("path", path);
        return map;
    }
}