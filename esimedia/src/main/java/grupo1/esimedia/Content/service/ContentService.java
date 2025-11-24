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
import grupo1.esimedia.Content.controller.CreatorContentController.CreateRequest;
import grupo1.esimedia.Content.controller.CreatorContentController.UpdateRequest;
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

    public Content create(CreateRequest req, ContentType actorType) {
        var now = Instant.now();
        Content c = new Content();

        // Validaciones server-side
        validateCreateRequest(req, actorType);

        c.setType(req.type());
        c.setTitle(req.title());
        c.setDescription(req.description());
        c.setTags(req.tags());
        c.setDurationMinutes(req.durationMinutes());
        c.setEdadMinima(req.edadMinima());
        c.setAvailableUntil(req.availableUntil() != null && !req.availableUntil().isBlank()
                ? LocalDate.parse(req.availableUntil())
                : null);

        if (req.type() == ContentType.VIDEO) {
            // Validación: resolución 4k sólo para VIP
            if (req.resolution() != null && String.valueOf(req.resolution()).equalsIgnoreCase("4k")
                    && (req.vipOnly() == null || !req.vipOnly())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La resolución 4k sólo está disponible para contenidos VIP");
            }
            c.setUrl(req.url());
            c.setResolution(req.resolution());
            c.setAudioFileName(null);
        } else {
            c.setUrl(null);
            c.setResolution(null);
            c.setAudioFileName(req.audioFileName());
        }

        // vipOnly flag: default false if not provided
        if (req.vipOnly() != null) {
            c.setVipOnly(req.vipOnly());
        } else {
            c.setVipOnly(false);
        }

        // Si no se proporciona coverFileName, usar el valor por defecto
        c.setCoverFileName(req.coverFileName() != null && !req.coverFileName().isBlank()
                ? req.coverFileName()
                : DEFAULT_COVER);
        c.setState(ContentState.PRIVADO);
        c.setStateChangedAt(now);
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        c.setCreatorAlias(req.creatorAlias());

        return repository.save(c);
    }

    private void applyCoverUpdate(Content existing, UpdateRequest req) {
        if (req.coverFileName() != null && !req.coverFileName().isBlank()) {
            existing.setCoverFileName(req.coverFileName());
        } else if (existing.getCoverFileName() == null || existing.getCoverFileName().isBlank()) {
            existing.setCoverFileName(DEFAULT_COVER);
        }
    }

    private void validateVipToggle(Content existing, UpdateRequest req) {
        if (req.vipOnly() != null && !req.vipOnly() && existing.getResolution() != null
                && String.valueOf(existing.getResolution()).equalsIgnoreCase("4k")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No puedes desactivar VIP en un contenido con resolución 4k");
        }
    }

    private void applyVipUpdate(Content existing, UpdateRequest req) {
        if (req.vipOnly() != null) {
            existing.setVipOnly(req.vipOnly());
        }
    }

    private void applyStateUpdate(Content existing, UpdateRequest req) {
        if (req.state() != null && !req.state().isBlank()
                && !existing.getState().name().equalsIgnoreCase(req.state())) {
            existing.setState(ContentState.valueOf(req.state().toUpperCase()));
            existing.setStateChangedAt(Instant.now());
        }
    }

    // Validación de create/update
    private void validateCreateRequest(CreateRequest req, ContentType actorType) {
        validateTitle(req.title());
        validateDescription(req.description());
        validateTags(req.tags());
        validateDuration(req.durationMinutes());
        validateEdadMinima(req.edadMinima());
        validateAvailableUntilIfPresent(req.availableUntil());
        validateContentTypeSpecificFields(req);
        validateActorTypeAuthorization(actorType, req.type());
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

    private void validateContentTypeSpecificFields(CreateRequest req) {
        if (req.type() == ContentType.VIDEO) {
            validateVideoCreate(req);
        } else {
            validateAudioCreate(req);
        }
    }

    private void validateAudioCreate(CreateRequest req) {
        if (req.audioFileName() == null || req.audioFileName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichero de audio requerido");
        }
    }

    private void validateActorTypeAuthorization(ContentType actorType, ContentType requestType) {
        if (actorType != null && !actorType.equals(requestType)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No estás autorizado para crear contenidos de este tipo");
        }
    }

    private void validateUpdateRequest(UpdateRequest req) {
        if (req.title() != null && req.title().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título es obligatorio");
        }
        if (req.title() != null && req.title().trim().length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título no puede superar 200 caracteres");
        }
        if (req.description() != null && req.description().length() > 3000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción es demasiado larga");
        }
        if (req.durationMinutes() != null && (req.durationMinutes() <= 0 || req.durationMinutes() > 10000)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duración inválida");
        }
        if (req.edadMinima() != null && (req.edadMinima() < 0 || req.edadMinima() > 99)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edad mínima debe estar entre 0 y 99");
        }
        if (req.availableUntil() != null && !req.availableUntil().isBlank()) {
            validateAvailableUntil(req.availableUntil());
        }
    }

    private void validateVideoCreate(CreateRequest req) {
        if (req.url() == null || req.url().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo requerida");
        }
        try {
            URI uri = new URI(req.url());
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo inválida");
            }
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL de vídeo inválida");
        }
        if (req.resolution() == null || req.resolution().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolución requerida");
        }
        if (String.valueOf(req.resolution()).equalsIgnoreCase("4k") && (req.vipOnly() == null || !req.vipOnly())) {
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

    public Optional<Content> update(String id, UpdateRequest req, ContentType actorType) {
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

    private void applyBasicFieldUpdates(Content existing, UpdateRequest req) {
        if (req.title() != null)
            existing.setTitle(req.title());
        if (req.description() != null)
            existing.setDescription(req.description());
        if (req.tags() != null)
            existing.setTags(req.tags());
        if (req.durationMinutes() != null)
            existing.setDurationMinutes(req.durationMinutes());
        if (req.edadMinima() != null)
            existing.setEdadMinima(req.edadMinima());
        if (req.availableUntil() != null && !req.availableUntil().isBlank()) {
            existing.setAvailableUntil(LocalDate.parse(req.availableUntil()));
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