package grupo1.esimedia.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:3000")
public class FileUploadController {

    // Ruta donde se guardan los archivos de audio
    private static final String AUDIO_UPLOAD_DIR = "src/main/resources/static/audio/";
    private static final String COVER_UPLOAD_DIR = "src/main/resources/static/cover/";
    
    // Tamaño máximo: 1MB = 1048576 bytes
    private static final long MAX_AUDIO_SIZE = 1048576; // 1MB
    private static final long MAX_COVER_SIZE = 5242880; // 5MB para portadas

    @PostMapping("/audio")
    public ResponseEntity<?> uploadAudioFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                response.put("error", "El archivo está vacío");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar el tamaño del archivo (máximo 1MB)
            if (file.getSize() > MAX_AUDIO_SIZE) {
                double sizeMB = file.getSize() / 1048576.0;
                response.put("error", String.format("El archivo es demasiado grande (%.2f MB). Máximo permitido: 1 MB", sizeMB));
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
            }

            // Validar el tipo de archivo (solo audio)
            String contentType = file.getContentType();
            if (contentType == null || !isAudioFile(contentType)) {
                response.put("error", "Tipo de archivo no permitido. Solo se aceptan archivos de audio (MP3, WAV, OGG, AAC)");
                return ResponseEntity.badRequest().body(response);
            }

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
            response.put("success", true);
            response.put("filename", uniqueFilename);
            response.put("originalFilename", originalFilename);
            response.put("size", file.getSize());
            response.put("contentType", contentType);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("error", "Error al guardar el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/cover")
    public ResponseEntity<?> uploadCoverImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (file.isEmpty()) {
                response.put("error", "El archivo está vacío");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar el tamaño del archivo (máximo 5MB para imágenes)
            if (file.getSize() > MAX_COVER_SIZE) {
                double sizeMB = file.getSize() / 1048576.0;
                response.put("error", String.format("La imagen es demasiado grande (%.2f MB). Máximo permitido: 5 MB", sizeMB));
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
            }

            // Validar el tipo de archivo (solo imágenes)
            String contentType = file.getContentType();
            if (contentType == null || !isImageFile(contentType)) {
                response.put("error", "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP)");
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

            response.put("success", true);
            response.put("filename", uniqueFilename);
            response.put("originalFilename", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("error", "Error al guardar la imagen: " + e.getMessage());
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
                response.put("success", true);
                response.put("message", "Archivo eliminado correctamente");
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Archivo no encontrado");
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            response.put("error", "Error al eliminar el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Métodos auxiliares para validar tipos de archivo
    private boolean isAudioFile(String contentType) {
        return contentType.equals("audio/mpeg") ||      // MP3
               contentType.equals("audio/mp3") ||
               contentType.equals("audio/wav") ||        // WAV
               contentType.equals("audio/wave") ||
               contentType.equals("audio/x-wav") ||
               contentType.equals("audio/ogg") ||        // OGG
               contentType.equals("audio/aac") ||        // AAC
               contentType.equals("audio/mp4") ||        // M4A
               contentType.equals("audio/x-m4a");
    }

    private boolean isImageFile(String contentType) {
        return contentType.equals("image/jpeg") ||
               contentType.equals("image/jpg") ||
               contentType.equals("image/png") ||
               contentType.equals("image/webp");
    }
}
