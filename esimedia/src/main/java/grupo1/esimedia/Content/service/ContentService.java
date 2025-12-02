package grupo1.esimedia.Content.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import grupo1.esimedia.Accounts.model.ContentType;
import grupo1.esimedia.Content.dto.CreateContentRequestDTO;
import grupo1.esimedia.Content.dto.UpdateContentRequestDTO;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;

@Service
public class ContentService {

    private final CreatorContentRepository repository;
    private static final String DEFAULT_COVER = "cover3.png";

    public ContentService(CreatorContentRepository repository) {
        this.repository = repository;
    }

    public List<Content> findAll() {
        return repository.findAll();
    }

    public Optional<Content> findById(String id) {
        return repository.findById(id);
    }

    public List<Content> findByCreatorAlias(String alias) {
        return repository.findAll().stream()
                .filter(c -> c.getCreatorAlias().equals(alias))
                .toList();
    }

    public Content create(CreateContentRequestDTO req, ContentType actorType) {
        var now = Instant.now();
        Content c = new Content();

        // Validaciones server-side
        validateCreateRequest(req, actorType);

        c.setType(req.getType());
        c.setTitle(req.getTitle());
        c.setDescription(req.getDescription());
        c.setTags(req.getTags());
        c.setDurationMinutes(req.getDurationMinutes());
        c.setEdadMinima(req.getEdadMinima());
        c.setAvailableUntil(req.getAvailableUntil() != null && !req.getAvailableUntil().isBlank()
                ? LocalDate.parse(req.getAvailableUntil())
                : null);

        if (req.getType() == ContentType.VIDEO) {
            // Validación: resolución 4k sólo para VIP
            if (req.getResolution() != null && String.valueOf(req.getResolution()).equalsIgnoreCase("4k")
                    && (req.getVipOnly() == null || !req.getVipOnly())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La resolución 4k sólo está disponible para contenidos VIP");
            }
            c.setUrl(req.getUrl());
            c.setResolution(req.getResolution());
            c.setAudioFileName(null);
        } else {
            c.setUrl(null);
            c.setResolution(null);
            c.setAudioFileName(req.getAudioFileName());
        }

        // vipOnly flag: default false if not provided
        if (req.getVipOnly() != null) {
            c.setVipOnly(req.getVipOnly());
        } else {
            c.setVipOnly(false);
        }

        // Si no se proporciona coverFileName, usar el valor por defecto
        c.setCoverFileName(req.getCoverFileName() != null && !req.getCoverFileName().isBlank()
                ? req.getCoverFileName()
                : DEFAULT_COVER);
        c.setState(ContentState.PRIVADO);
        c.setStateChangedAt(now);
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        c.setCreatorAlias(req.getCreatorAlias());

        return repository.save(c);
    }

    private void applyCoverUpdate(Content existing, UpdateContentRequestDTO req) {
        if (req.getCoverFileName() != null && !req.getCoverFileName().isBlank()) {
            existing.setCoverFileName(req.getCoverFileName());
        } else if (existing.getCoverFileName() == null || existing.getCoverFileName().isBlank()) {
            existing.setCoverFileName(DEFAULT_COVER);
        }
    }

    private void validateVipToggle(Content existing, UpdateContentRequestDTO req) {
        if (req.getVipOnly() != null && !req.getVipOnly() && existing.getResolution() != null
                && String.valueOf(existing.getResolution()).equalsIgnoreCase("4k")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No puedes desactivar VIP en un contenido con resolución 4k");
        }
    }

    private void applyVipUpdate(Content existing, UpdateContentRequestDTO req) {
        if (req.getVipOnly() != null) {
            existing.setVipOnly(req.getVipOnly());
        }
    }

    private void applyStateUpdate(Content existing, UpdateContentRequestDTO req) {
        if (req.getState() != null && !req.getState().isBlank()
                && !existing.getState().name().equalsIgnoreCase(req.getState())) {
            existing.setState(ContentState.valueOf(req.getState().toUpperCase()));
            existing.setStateChangedAt(Instant.now());
        }
    }

    // Validación de create/update
    private void validateCreateRequest(CreateContentRequestDTO req, ContentType actorType) {
        validateTitle(req.getTitle());
        validateDescription(req.getDescription());
        validateTags(req.getTags());
        validateDuration(req.getDurationMinutes());
        validateEdadMinima(req.getEdadMinima());
        validateAvailableUntilIfPresent(req.getAvailableUntil());
        validateContentTypeSpecificFields(req);
        validateActorTypeAuthorization(actorType, req.getType());
    }

    private void validateTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título es obligatorio");
        }
        if (title.trim().length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título no puede superar 200 caracteres");
        }
    }

    private void validateDescription(String description) {
        if (description != null && description.length() > 3000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción es demasiado larga");
        }
    }

    private void validateTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona al menos una etiqueta");
        }
    }

    private void validateDuration(Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes <= 0 || durationMinutes > 10000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duración inválida");
        }
    }

    private void validateEdadMinima(Integer edadMinima) {
        if (edadMinima == null || edadMinima < 0 || edadMinima > 99) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edad mínima debe estar entre 0 y 99");
        }
    }

    private void validateAvailableUntilIfPresent(String availableUntil) {
        if (availableUntil != null && !availableUntil.isBlank()) {
            validateAvailableUntil(availableUntil);
        }
    }

    private void validateContentTypeSpecificFields(CreateContentRequestDTO req) {
        if (req.getType() == ContentType.VIDEO) {
            validateVideoCreate(req);
        } else {
            validateAudioCreate(req);
        }
    }

    private void validateAudioCreate(CreateContentRequestDTO req) {
        if (req.getAudioFileName() == null || req.getAudioFileName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichero de audio requerido");
        }
    }

    private void validateActorTypeAuthorization(ContentType actorType, ContentType requestType) {
        if (actorType != null && !actorType.equals(requestType)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No estás autorizado para crear contenidos de este tipo");
        }
    }

    private void validateUpdateRequest(UpdateContentRequestDTO req) {
        if (req.getTitle() != null && req.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título es obligatorio");
        }
        if (req.getTitle() != null && req.getTitle().trim().length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título no puede superar 200 caracteres");
        }
        if (req.getDescription() != null && req.getDescription().length() > 3000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción es demasiado larga");
        }
        if (req.getDurationMinutes() != null && (req.getDurationMinutes() <= 0 || req.getDurationMinutes() > 10000)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duración inválida");
        }
        if (req.getEdadMinima() != null && (req.getEdadMinima() < 0 || req.getEdadMinima() > 99)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edad mínima debe estar entre 0 y 99");
        }
        if (req.getAvailableUntil() != null && !req.getAvailableUntil().isBlank()) {
            validateAvailableUntil(req.getAvailableUntil());
        }
    }

    private void validateVideoCreate(CreateContentRequestDTO req) {
        if (req.getUrl() == null || req.getUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo requerida");
        }
        try {
            URI uri = new URI(req.getUrl());
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo inválida");
            }
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo inválida");
        }
        if (req.getResolution() == null || req.getResolution().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolución requerida");
        }
        if (String.valueOf(req.getResolution()).equalsIgnoreCase("4k") && (req.getVipOnly() == null || !req.getVipOnly())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La resolución 4k sólo está disponible para contenidos VIP");
        }
    }

    private void validateAvailableUntil(String availableUntil) {
        try {
            LocalDate date = LocalDate.parse(availableUntil);
            LocalDate today = LocalDate.now();
            if (date.isBefore(today)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha debe ser hoy o futura");
            }
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha inválida");
        }
    }

    public Optional<Content> update(String id, UpdateContentRequestDTO req, ContentType actorType) {
        return repository.findById(id).map(existing -> {
            // Autorizar: derivado del token (actorType) en el controlador
            if (actorType != null && !existing.getType().equals(actorType)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No estás autorizado para modificar contenidos de este tipo");
            }

            // Validar campos suministrados
            validateUpdateRequest(req);

            // Aplicar actualizaciones de campos básicos
            applyBasicFieldUpdates(existing, req);

            // Aplicar actualizaciones específicas
            applyCoverUpdate(existing, req);
            validateVipToggle(existing, req);
            applyVipUpdate(existing, req);
            applyStateUpdate(existing, req);

            existing.setUpdatedAt(Instant.now());
            return repository.save(existing);
        });
    }

    private void applyBasicFieldUpdates(Content existing, UpdateContentRequestDTO req) {
        if (req.getTitle() != null)
            existing.setTitle(req.getTitle());
        if (req.getDescription() != null)
            existing.setDescription(req.getDescription());
        if (req.getTags() != null)
            existing.setTags(req.getTags());
        if (req.getDurationMinutes() != null)
            existing.setDurationMinutes(req.getDurationMinutes());
        if (req.getEdadMinima() != null)
            existing.setEdadMinima(req.getEdadMinima());
        if (req.getAvailableUntil() != null && !req.getAvailableUntil().isBlank()) {
            existing.setAvailableUntil(LocalDate.parse(req.getAvailableUntil()));
        }
    }

    public boolean delete(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Incrementa el contador de reproducciones de un contenido.
     */
    public void incrementViewCount(String contentId) {
        repository.findById(contentId).ifPresent(content -> {
            content.incrementViewCount();
            repository.save(content);
        });
    }

    /**
     * Obtiene el contador de reproducciones de un contenido.
     */
    public Long getViewCount(String contentId) {
        return repository.findById(contentId)
            .map(Content::getViewCount)
            .orElse(0L);
    }
}