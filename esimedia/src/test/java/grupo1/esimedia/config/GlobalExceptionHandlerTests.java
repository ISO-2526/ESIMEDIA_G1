package grupo1.esimedia.config;

import grupo1.esimedia.exception.ErrorResponse;
import grupo1.esimedia.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias para GlobalExceptionHandler.
 * Tarea 531 - HDU 494
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTests {

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
    }

    @Test
    void handleResourceNotFound_Returns404WithErrorResponse() {
        // Arrange
        ResourceNotFoundException exception = new ResourceNotFoundException("Notificación", "id", "123");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleResourceNotFound(exception, request);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Not Found", response.getBody().getError());
        assertTrue(response.getBody().getMessage().contains("Notificación"));
        assertEquals("/api/test", response.getBody().getPath());
    }

    @Test
    void handleAccessDenied_Returns403WithErrorResponse() {
        // Arrange
        AccessDeniedException exception = new AccessDeniedException("Acceso denegado");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleAccessDenied(exception, request);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals("Forbidden", response.getBody().getError());
        assertEquals("No tienes permiso para acceder a este recurso", response.getBody().getMessage());
    }

    @Test
    void handleIllegalArgument_Returns400WithErrorResponse() {
        // Arrange
        IllegalArgumentException exception = new IllegalArgumentException("Argumento inválido");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleIllegalArgument(exception, request);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Bad Request", response.getBody().getError());
        assertEquals("Argumento inválido", response.getBody().getMessage());
    }

    @Test
    void handleGenericException_Returns500WithErrorResponse() {
        // Arrange
        RuntimeException exception = new RuntimeException("Error inesperado");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleGenericException(exception, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertEquals("Ha ocurrido un error inesperado. Por favor, inténtalo más tarde.", response.getBody().getMessage());
    }

    @Test
    void handleValidationErrors_Returns400WithFieldErrors() {
        // Arrange
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field", "El campo es obligatorio");
        
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        // Act
        ResponseEntity<Map<String, Object>> response = globalExceptionHandler.handleValidationErrors(exception);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("Bad Request", response.getBody().get("error"));
        assertNotNull(response.getBody().get("fields"));
        
        @SuppressWarnings("unchecked")
        Map<String, String> fields = (Map<String, String>) response.getBody().get("fields");
        assertEquals("El campo es obligatorio", fields.get("field"));
    }

    @Test
    void handleResourceNotFound_WithSimpleConstructor_ReturnsCorrectMessage() {
        // Arrange
        ResourceNotFoundException exception = new ResourceNotFoundException("El recurso solicitado no existe");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleResourceNotFound(exception, request);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("El recurso solicitado no existe", response.getBody().getMessage());
    }

    @Test
    void errorResponse_HasTimestamp() {
        // Arrange
        ResourceNotFoundException exception = new ResourceNotFoundException("Test");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleResourceNotFound(exception, request);

        // Assert
        assertNotNull(response.getBody().getTimestamp());
    }
}
