package com.esimedia.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.InputStream;

@RestController
@RequestMapping("/api/upload")
@PreAuthorize("hasRole('CREATOR')")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    private static final String ERROR = "error";
    private static final String SUCCESS = "success";


    // Ruta donde se guardan los archivos de audio
    private static final String AUDIO_UPLOAD_DIR = "src/main/resources/static/audio/";
    private static final String COVER_UPLOAD_DIR = "src/main/resources/static/cover/";
    
    // Tamaño máximo: 1MB = 1048576 bytes
    private static final long MAX_AUDIO_SIZE = 1048576; // 1MB
    private static final long MAX_COVER_SIZE = 5242880; // 5MB para portadas

    private static final Set<String> ALLOWED_AUDIO_MIME_TYPES = Set.of(
        "audio/mpeg", 
        "audio/mp3", 
        "audio/wav", 
        "audio/x-wav", 
        "audio/ogg", 
        "audio/aac", 
        "audio/x-m4a"
        // Se pueden añadir más si son necesarios, pero en minúsculas.
    );

    @PostMapping("/audio")
    public ResponseEntity<?> uploadAudioFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                response.put(ERROR, "El archivo está vacío");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar el tamaño del archivo (máximo 1MB)
            if (file.getSize() > MAX_AUDIO_SIZE) {
                double sizeMB = file.getSize() / 1048576.0;
                response.put(ERROR, String.format("El archivo es demasiado grande (%.2f MB). Máximo permitido: 1 MB", sizeMB));
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
            }

            validateFileMagicNumbers(file, ALLOWED_AUDIO_MIME_TYPES);
            // Si llega aquí, el archivo es de audio legítimo.

            // Obtener el nombre original y la extensión
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Generar un nombre único para el archivo
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Crear el directorio si no existe
            Path uploadPath = Paths.get(AUDIO_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Guardar el archivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Respuesta exitosa
            response.put(SUCCESS, true);
            response.put("filename", uniqueFilename);
            response.put("originalFilename", originalFilename);
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());

            return ResponseEntity.ok(response);

        } catch (SecurityException se) {
            // Capturar el error específico de Tika/Magic Numbers
            response.put(ERROR, se.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IOException e) {
            response.put(ERROR, "Error al guardar el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/cover")
    public ResponseEntity<?> uploadCoverImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (file.isEmpty()) {
                response.put(ERROR, "El archivo está vacío");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar el tamaño del archivo (máximo 5MB para imágenes)
            if (file.getSize() > MAX_COVER_SIZE) {
                double sizeMB = file.getSize() / 1048576.0;
                response.put(ERROR, String.format("La imagen es demasiado grande (%.2f MB). Máximo permitido: 5 MB", sizeMB));
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
            }

            // Validar el tipo de archivo (solo imágenes)
            String contentType = file.getContentType();
            if (contentType == null || !isImageFile(contentType)) {
                response.put(ERROR, "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP)");
                return ResponseEntity.badRequest().body(response);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;

            Path uploadPath = Paths.get(COVER_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            response.put(SUCCESS, true);
            response.put("filename", uniqueFilename);
            response.put("originalFilename", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put(ERROR, "Error al guardar la imagen: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/audio/{filename}")
    public ResponseEntity<?> deleteAudioFile(@PathVariable String filename) {
        Map<String, Object> response = new HashMap<>();

        try {
            Path filePath = Paths.get(AUDIO_UPLOAD_DIR).resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                response.put(SUCCESS, true);
                response.put("message", "Archivo eliminado correctamente");
                return ResponseEntity.ok(response);
            } else {
                response.put(ERROR, "Archivo no encontrado");
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            response.put(ERROR, "Error al eliminar el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

// -------------------------------------------------------------
    // ⭐ MÉTODO DE VALIDACIÓN CON MAGIC NUMBERS (Tika) ⭐
    // -------------------------------------------------------------
    /**
     * Valida un archivo usando "Magic Numbers" (Apache Tika) contra una lista blanca.
     * Esto previene que se suban archivos con extensiones falsificadas.
     * * NOTA: Este es el método que me pasaste en el primer mensaje.
     */
    private void validateFileMagicNumbers(MultipartFile file, Set<String> allowedMagicTypes) throws IOException {
        String magicType;
        Tika tika = new Tika();

        // Usamos try-with-resources para asegurar que el stream se cierra
        try (InputStream inputStream = file.getInputStream()) {
            magicType = tika.detect(inputStream);
        } catch (IOException e) {
            log.error("Error al leer el stream del archivo para validación Tika", e);
            // Propagamos la excepción
            throw new IOException("Error al procesar el archivo", e); 
        }

        // Comprobamos contra la lista blanca SEGURA
        if (magicType == null || !allowedMagicTypes.contains(magicType.toLowerCase())) {
            log.warn("[BLOQUEO DE SEGURIDAD] Rechazo de archivo. " +
                    "Nombre: {}. " +
                    "MIME Cliente: {}. " +
                    "MIME Real (Tika): {}. " +
                    "Permitidos: {}",
                    file.getOriginalFilename(),
                    file.getContentType(),
                    magicType,
                    allowedMagicTypes);
            
            throw new SecurityException(
                "El tipo de archivo real (" + magicType + ") no está permitido. " +
                "El archivo puede ser malicioso o estar corrupto."
            );
        }

        log.debug("✅ Validación Tika superada. Tipo real: {}", magicType);
    }

    private boolean isImageFile(String contentType) {
        return contentType.equals("image/jpeg") ||
               contentType.equals("image/jpg") ||
               contentType.equals("image/png") ||
               contentType.equals("image/webp");
    }
}