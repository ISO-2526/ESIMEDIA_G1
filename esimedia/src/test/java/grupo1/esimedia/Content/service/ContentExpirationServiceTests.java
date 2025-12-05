package grupo1.esimedia.Content.service;

import grupo1.esimedia.Accounts.model.Notification;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.NotificationRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tarea 518: Pruebas unitarias para ContentExpirationService.
 */
@ExtendWith(MockitoExtension.class)
class ContentExpirationServiceTests {

    @Mock
    private CreatorContentRepository contentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private ContentExpirationService expirationService;

    // ========== Tests para alertContentExpiringSoon (Tarea 515) ==========

    @Test
    void alertContentExpiringSoon_ShouldNotifyEligibleUsers() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content content = new Content();
        content.setId("c1");
        content.setTitle("Test Movie");
        content.setState(ContentState.PUBLICO);
        content.setVipOnly(false);
        content.setEdadMinima(0);
        content.setAvailableUntil(in7Days);

        User user = new User();
        user.setEmail("user@test.com");
        user.setVip(false);

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(content));
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(notificationRepository.existsByUserIdAndRelatedContentIdAndNotificationType(
                anyString(), anyString(), anyString())).thenReturn(false);

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void alertContentExpiringSoon_ShouldSkipPrivateContent() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content privateContent = new Content();
        privateContent.setId("c1");
        privateContent.setTitle("Private Movie");
        privateContent.setState(ContentState.PRIVADO); // No es público
        privateContent.setAvailableUntil(in7Days);

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(privateContent));

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert - No debe buscar usuarios ni guardar notificaciones
        verify(userRepository, never()).findAll();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // ========== Tests para anti-spam (Tarea 516) ==========

    @Test
    void alertContentExpiringSoon_ShouldNotNotifyIfAlreadyNotified() {
        // Arrange (Anti-spam)
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content content = new Content();
        content.setId("c1");
        content.setTitle("Test Movie");
        content.setState(ContentState.PUBLICO);
        content.setVipOnly(false);
        content.setEdadMinima(0);
        content.setAvailableUntil(in7Days);

        User user = new User();
        user.setEmail("user@test.com");

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(content));
        when(userRepository.findAll()).thenReturn(List.of(user));
        // Ya fue notificado anteriormente
        when(notificationRepository.existsByUserIdAndRelatedContentIdAndNotificationType(
                "user@test.com", "c1", "EXPIRING_SOON")).thenReturn(true);

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert - No debe guardar nueva notificación
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void alertContentExpiringSoon_ShouldNotNotifyNonVipForVipContent() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content vipContent = new Content();
        vipContent.setId("c1");
        vipContent.setTitle("VIP Movie");
        vipContent.setState(ContentState.PUBLICO);
        vipContent.setVipOnly(true);
        vipContent.setEdadMinima(0);
        vipContent.setAvailableUntil(in7Days);

        User regularUser = new User();
        regularUser.setEmail("regular@test.com");
        regularUser.setVip(false);

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(vipContent));
        when(userRepository.findAll()).thenReturn(List.of(regularUser));

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void alertContentExpiringSoon_ShouldNotifyVipUserForVipContent() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content vipContent = new Content();
        vipContent.setId("c1");
        vipContent.setTitle("VIP Movie");
        vipContent.setState(ContentState.PUBLICO);
        vipContent.setVipOnly(true);
        vipContent.setEdadMinima(0);
        vipContent.setAvailableUntil(in7Days);

        User vipUser = new User();
        vipUser.setEmail("vip@test.com");
        vipUser.setVip(true);

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(vipContent));
        when(userRepository.findAll()).thenReturn(List.of(vipUser));
        when(notificationRepository.existsByUserIdAndRelatedContentIdAndNotificationType(
                anyString(), anyString(), anyString())).thenReturn(false);

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void alertContentExpiringSoon_ShouldNotNotifyUnderageUsers() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content adultContent = new Content();
        adultContent.setId("c1");
        adultContent.setTitle("Adult Movie");
        adultContent.setState(ContentState.PUBLICO);
        adultContent.setVipOnly(false);
        adultContent.setEdadMinima(18);
        adultContent.setAvailableUntil(in7Days);

        User kid = new User();
        kid.setEmail("kid@test.com");
        kid.setDateOfBirth(LocalDate.now().minusYears(15).toString()); // 15 años

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(adultContent));
        when(userRepository.findAll()).thenReturn(List.of(kid));

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void alertContentExpiringSoon_ShouldNotifyAdultUserForAdultContent() {
        // Arrange
        LocalDate in7Days = LocalDate.now().plusDays(7);

        Content adultContent = new Content();
        adultContent.setId("c1");
        adultContent.setTitle("Adult Movie");
        adultContent.setState(ContentState.PUBLICO);
        adultContent.setVipOnly(false);
        adultContent.setEdadMinima(18);
        adultContent.setAvailableUntil(in7Days);

        User adult = new User();
        adult.setEmail("adult@test.com");
        adult.setDateOfBirth(LocalDate.now().minusYears(25).toString()); // 25 años

        when(contentRepository.findByAvailableUntil(in7Days)).thenReturn(List.of(adultContent));
        when(userRepository.findAll()).thenReturn(List.of(adult));
        when(notificationRepository.existsByUserIdAndRelatedContentIdAndNotificationType(
                anyString(), anyString(), anyString())).thenReturn(false);

        // Act
        expirationService.alertContentExpiringSoon();

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    // ========== Tests para expireOldContent (Tarea 517) ==========

    @Test
    void expireOldContent_ShouldMarkContentAsCaducado() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);

        Content expiredContent = new Content();
        expiredContent.setId("c1");
        expiredContent.setTitle("Expired Movie");
        expiredContent.setState(ContentState.PUBLICO);
        expiredContent.setAvailableUntil(yesterday);

        when(contentRepository.findByStateAndAvailableUntilLessThanEqual(
                ContentState.PUBLICO, LocalDate.now())).thenReturn(List.of(expiredContent));

        // Act
        expirationService.expireOldContent();

        // Assert
        ArgumentCaptor<Content> captor = ArgumentCaptor.forClass(Content.class);
        verify(contentRepository).save(captor.capture());

        Content saved = captor.getValue();
        assertEquals(ContentState.CADUCADO, saved.getState());
        assertNotNull(saved.getStateChangedAt());
    }

    @Test
    void expireOldContent_ShouldNotAffectFutureContent() {
        // Arrange - No hay contenido vencido
        when(contentRepository.findByStateAndAvailableUntilLessThanEqual(
                ContentState.PUBLICO, LocalDate.now())).thenReturn(List.of());

        // Act
        expirationService.expireOldContent();

        // Assert
        verify(contentRepository, never()).save(any(Content.class));
    }

    @Test
    void expireOldContent_ShouldExpireMultipleContents() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);

        Content expired1 = new Content();
        expired1.setId("c1");
        expired1.setTitle("Expired Movie 1");
        expired1.setState(ContentState.PUBLICO);
        expired1.setAvailableUntil(yesterday);

        Content expired2 = new Content();
        expired2.setId("c2");
        expired2.setTitle("Expired Movie 2");
        expired2.setState(ContentState.PUBLICO);
        expired2.setAvailableUntil(yesterday);

        when(contentRepository.findByStateAndAvailableUntilLessThanEqual(
                ContentState.PUBLICO, LocalDate.now())).thenReturn(List.of(expired1, expired2));

        // Act
        expirationService.expireOldContent();

        // Assert
        verify(contentRepository, times(2)).save(any(Content.class));
    }

    @Test
    void expireOldContent_ShouldExpireContentExpiringToday() {
        // Arrange - Contenido que caduca exactamente hoy
        LocalDate today = LocalDate.now();

        Content expiringToday = new Content();
        expiringToday.setId("c1");
        expiringToday.setTitle("Expiring Today");
        expiringToday.setState(ContentState.PUBLICO);
        expiringToday.setAvailableUntil(today);

        when(contentRepository.findByStateAndAvailableUntilLessThanEqual(
                ContentState.PUBLICO, today)).thenReturn(List.of(expiringToday));

        // Act
        expirationService.expireOldContent();

        // Assert
        ArgumentCaptor<Content> captor = ArgumentCaptor.forClass(Content.class);
        verify(contentRepository).save(captor.capture());
        assertEquals(ContentState.CADUCADO, captor.getValue().getState());
    }
}
