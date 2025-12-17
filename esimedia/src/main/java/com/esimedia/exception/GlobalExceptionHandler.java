package com.esimedia.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice; 
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

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

    private static final String ERROR = "error";
    private static final String TIMESTAMP = "timestamp";
    private static final String MESSAGE = "message";
    private static final String PATH = "path";
    private static final String STATUS = "status";

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
        response.put(ERROR, firstError);
        response.put("fields", fieldErrors);
        response.put(TIMESTAMP, LocalDateTime.now());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // --- Manejo de Excepciones de Spring WebServer ---

    /**
     * Maneja las excepciones comunes lanzadas con un código HTTP específico.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, ex.getStatusCode().value());
        body.put(ERROR, ex.getReason());
        body.put(MESSAGE, ex.getReason());
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    /**
     * Maneja excepciones de IllegalArgumentException.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(ERROR, "Invalid Argument");
        body.put(MESSAGE, ex.getMessage());
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja errores 404 - Recurso no encontrado.
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFoundException(NoHandlerFoundException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, HttpStatus.NOT_FOUND.value());
        body.put(ERROR, "Not Found");
        body.put(MESSAGE, "El recurso solicitado no existe");
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Maneja errores 403 - Acceso denegado.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, HttpStatus.FORBIDDEN.value());
        body.put(ERROR, "Forbidden");
        body.put(MESSAGE, "No tienes permisos para acceder a este recurso");
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    /**
     * Maneja errores 401 - No autenticado.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, HttpStatus.UNAUTHORIZED.value());
        body.put(ERROR, "Unauthorized");
        body.put(MESSAGE, "Credenciales inválidas o sesión expirada");
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
    
    // --- Manejo de Excepciones Genéricas (Fallback) ---

    /**
     * Maneja excepciones genéricas no capturadas (Fallback).
     * NO expone detalles técnicos ni stack traces por seguridad.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        // IMPORTANTE: Loguear el error completo internamente para debugging
        System.err.println("[ERROR INTERNO] " + ex.getClass().getName() + ": " + ex.getMessage());
        ex.printStackTrace(); // Solo en logs del servidor, NO en la respuesta
        
        // Respuesta segura sin detalles técnicos
        Map<String, Object> body = new HashMap<>();
        body.put(TIMESTAMP, LocalDateTime.now());
        body.put(STATUS, HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put(ERROR, "Internal Server Error");
        body.put(MESSAGE, "Ha ocurrido un error interno. Por favor, contacta con soporte.");
        body.put(PATH, request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}