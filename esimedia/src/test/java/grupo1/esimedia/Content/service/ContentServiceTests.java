package grupo1.esimedia.Content.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import grupo1.esimedia.Accounts.model.ContentType;
import grupo1.esimedia.Content.controller.CreatorContentController.CreateRequest;
import grupo1.esimedia.Content.controller.CreatorContentController.UpdateRequest;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;

@ExtendWith(MockitoExtension.class)
class ContentServiceTests {

    @Mock
    private CreatorContentRepository repository;

    @InjectMocks
    private ContentService service;

    @Test
    void createVideoRejects4kResolutionWithoutVipFlag() {
        CreateRequest req = new CreateRequest(
            ContentType.VIDEO,
            "Video Title",
            "Desc",
            List.of("tag"),
            false,
            60,
            12,
            futureDate(),
            "https://cdn.example/video.mp4",
            "4k",
            null,
            null,
            "creator"
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(req, ContentType.VIDEO));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void createVideoSetsDefaultsWhenOptionalFieldsMissing() {
        when(repository.save(any(Content.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateRequest req = new CreateRequest(
            ContentType.VIDEO,
            "Valid title",
            "Desc",
            List.of("tag"),
            null,
            45,
            13,
            null,
            "https://cdn.example/video.mp4",
            "1080p",
            null,
            "",
            "creator"
        );

        Content saved = service.create(req, ContentType.VIDEO);

        assertEquals("cover3.png", saved.getCoverFileName());
        assertFalse(saved.isVipOnly());
        assertEquals(ContentState.PRIVADO, saved.getState());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getStateChangedAt());
        assertEquals("creator", saved.getCreatorAlias());
        assertEquals("1080p", saved.getResolution());
        assertEquals("https://cdn.example/video.mp4", saved.getUrl());
        assertEquals(null, saved.getAvailableUntil());
    }

    @Test
    void createAudioRequiresAudioFileName() {
        CreateRequest req = new CreateRequest(
            ContentType.AUDIO,
            "Audio title",
            "Desc",
            List.of("tag"),
            true,
            30,
            10,
            futureDate(),
            null,
            null,
            null,
            null,
            "creator"
        );

        assertThrows(ResponseStatusException.class, () -> service.create(req, ContentType.AUDIO));
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsPastAvailableUntilDate() {
        CreateRequest req = new CreateRequest(
            ContentType.VIDEO,
            "Video",
            "Desc",
            List.of("tag"),
            true,
            60,
            12,
            LocalDate.now().minusDays(1).toString(),
            "https://cdn.example/video.mp4",
            "1080p",
            null,
            null,
            "creator"
        );

        assertThrows(ResponseStatusException.class, () -> service.create(req, ContentType.VIDEO));
    }

    @Test
    void createRejectsActorTypeMismatch() {
        CreateRequest req = new CreateRequest(
            ContentType.VIDEO,
            "Video",
            "Desc",
            List.of("tag"),
            true,
            60,
            12,
            futureDate(),
            "https://cdn.example/video.mp4",
            "1080p",
            null,
            null,
            "creator"
        );

        assertThrows(ResponseStatusException.class, () -> service.create(req, ContentType.AUDIO));
    }

    @Test
    void updateRejectsActorTypeDifferentFromExistingContent() {
        Content existing = buildContent(ContentType.VIDEO);
        when(repository.findById("content-1")).thenReturn(Optional.of(existing));

        UpdateRequest req = new UpdateRequest(null, null, null, null, null, null, null, null, null);

        assertThrows(ResponseStatusException.class, () -> service.update("content-1", req, ContentType.AUDIO));
        verify(repository, never()).save(any());
    }

    @Test
    void updateAppliesFieldUpdatesAndCoverDefaults() {
        Content existing = buildContent(ContentType.VIDEO);
        existing.setCoverFileName(null);
        existing.setState(ContentState.PRIVADO);
        when(repository.findById("content-2")).thenReturn(Optional.of(existing));
        when(repository.save(any(Content.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateRequest req = new UpdateRequest(
            "New title",
            "New description",
            List.of("updated"),
            true,
            90,
            18,
            futureDate(),
            "",
            "PUBLICO"
        );

        Optional<Content> result = service.update("content-2", req, ContentType.VIDEO);

        assertTrue(result.isPresent());
        Content updated = result.get();
        assertEquals("New title", updated.getTitle());
        assertEquals("New description", updated.getDescription());
        assertEquals(List.of("updated"), updated.getTags());
        assertEquals(90, updated.getDurationMinutes());
        assertEquals(18, updated.getEdadMinima());
        assertEquals(LocalDate.parse(req.availableUntil()), updated.getAvailableUntil());
        assertEquals("cover3.png", updated.getCoverFileName());
        assertEquals(ContentState.PUBLICO, updated.getState());
        assertTrue(updated.isVipOnly());
        assertNotNull(updated.getStateChangedAt());
    }

    @Test
    void updateRejectsVipToggleWhenContentIs4k() {
        Content existing = buildContent(ContentType.VIDEO);
        existing.setResolution("4K");
        when(repository.findById("content-3")).thenReturn(Optional.of(existing));

        UpdateRequest req = new UpdateRequest(null, null, null, false, null, null, null, null, null);

        assertThrows(ResponseStatusException.class, () -> service.update("content-3", req, ContentType.VIDEO));
    }

    @Test
    void deleteRemovesContentWhenExists() {
        when(repository.existsById("content-4")).thenReturn(true);

        assertTrue(service.delete("content-4"));
        verify(repository).deleteById("content-4");
    }

    @Test
    void deleteReturnsFalseWhenMissing() {
        when(repository.existsById("missing")).thenReturn(false);

        assertFalse(service.delete("missing"));
        verify(repository, never()).deleteById("missing");
    }

    @Test
    void incrementViewCountPersistsUpdatedContent() {
        Content existing = buildContent(ContentType.VIDEO);
        existing.setViewCount(5L);
        when(repository.findById("content-5")).thenReturn(Optional.of(existing));

        service.incrementViewCount("content-5");

        ArgumentCaptor<Content> captor = ArgumentCaptor.forClass(Content.class);
        verify(repository).save(captor.capture());
        assertEquals(6L, captor.getValue().getViewCount());
    }

    @Test
    void getViewCountReturnsZeroWhenContentMissing() {
        when(repository.findById("unknown")).thenReturn(Optional.empty());

        assertEquals(0L, service.getViewCount("unknown"));
    }

    private Content buildContent(ContentType type) {
        Content content = new Content();
        content.setId("generated-id");
        content.setType(type);
        content.setTitle("Original");
        content.setDescription("Desc");
        content.setTags(List.of("tag"));
        content.setDurationMinutes(60);
        content.setEdadMinima(12);
        content.setAvailableUntil(LocalDate.now().plusDays(5));
        content.setState(ContentState.PRIVADO);
        content.setStateChangedAt(Instant.now());
        content.setCreatedAt(Instant.now());
        content.setUpdatedAt(Instant.now());
        content.setCreatorAlias("creator");
        content.setVipOnly(false);
        content.setUrl("https://cdn.example/video.mp4");
        content.setResolution("1080p");
        return content;
    }

    private String futureDate() {
        return LocalDate.now().plusDays(10).toString();
    }
}
