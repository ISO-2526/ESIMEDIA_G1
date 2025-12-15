package grupo1.esimedia.Content.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import grupo1.esimedia.Accounts.model.Notification;
import grupo1.esimedia.Accounts.model.User;
import grupo1.esimedia.Accounts.repository.NotificationRepository;
import grupo1.esimedia.Accounts.repository.UserRepository;
import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import grupo1.esimedia.Content.model.ExpirationAlert;
import grupo1.esimedia.Content.repository.CreatorContentRepository;
import grupo1.esimedia.Content.repository.ExpirationAlertRepository;

/**
 * Tests unitarios para ContentExpirationService (HDU 493 - Task 518)
 */
@ExtendWith(MockitoExtension.class)
class ContentExpirationServiceTests {

    @Mock
    private CreatorContentRepository contentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ExpirationAlertRepository expirationAlertRepository;

    @InjectMocks
    private ContentExpirationService service;

    private Content publicContent;
    private Content vipContent;
    private User adultUser;
    private User kidUser;
    private User vipUser;

    @BeforeEach
    void setUp() {
        // Contenido público normal
        publicContent = new Content();
        publicContent.setId("content-1");
        publicContent.setTitle("Test Content");
        publicContent.setState(ContentState.PUBLICO);
        publicContent.setAvailableUntil(LocalDate.now().plusDays(7));
        publicContent.setVipOnly(false);
        publicContent.setEdadMinima(0);
        publicContent.setCreatorAlias("creator");

        // Contenido VIP
        vipContent = new Content();
        vipContent.setId("content-vip");
        vipContent.setTitle("VIP Content");
        vipContent.setState(ContentState.PUBLICO);
        vipContent.setAvailableUntil(LocalDate.now().plusDays(7));
        vipContent.setVipOnly(true);
        vipContent.setEdadMinima(18);

        // Usuario adulto normal
        adultUser = new User();
        adultUser.setEmail("adult@test.com");
        adultUser.setDateOfBirth(LocalDate.now().minusYears(25).toString());
        adultUser.setVip(false);

        // Usuario menor de edad
        kidUser = new User();
        kidUser.setEmail("kid@test.com");
        kidUser.setDateOfBirth(LocalDate.now().minusYears(10).toString());
        kidUser.setVip(false);

        // Usuario VIP adulto
        vipUser = new User();
        vipUser.setEmail("vip@test.com");
        vipUser.setDateOfBirth(LocalDate.now().minusYears(30).toString());
        vipUser.setVip(true);
    }

    // ========== Task 515: Tests para alertas de contenido próximo a caducar ==========

    @Test
    void checkAndAlertExpiringContent_ShouldAlertUsersForExpiringContent() {
        // Arrange
        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(List.of(publicContent));
        when(userRepository.findAll()).thenReturn(List.of(adultUser));
        when(expirationAlertRepository.findByContentIdAndUserIdAndAlertType(any(), any(), any()))
            .thenReturn(Optional.empty()); // No hay alerta previa

        // Act
        service.checkAndAlertExpiringContent();

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(expirationAlertRepository, times(1)).save(any(ExpirationAlert.class));
    }

    @Test
    void checkAndAlertExpiringContent_ShouldNotAlertWhenNoExpiringContent() {
        // Arrange
        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(Collections.emptyList());

        // Act
        service.checkAndAlertExpiringContent();

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // ========== Task 516: Tests para filtros de acceso ==========

    @Test
    void checkAndAlertExpiringContent_ShouldNotAlertNonVipUserForVipContent() {
        // Arrange
        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(List.of(vipContent));
        when(userRepository.findAll()).thenReturn(List.of(adultUser)); // Usuario NO VIP

        // Act
        service.checkAndAlertExpiringContent();

        // Assert: No debe enviar notificación porque el usuario no es VIP
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void checkAndAlertExpiringContent_ShouldAlertVipUserForVipContent() {
        // Arrange
        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(List.of(vipContent));
        when(userRepository.findAll()).thenReturn(List.of(vipUser)); // Usuario VIP adulto
        when(expirationAlertRepository.findByContentIdAndUserIdAndAlertType(any(), any(), any()))
            .thenReturn(Optional.empty());

        // Act
        service.checkAndAlertExpiringContent();

        // Assert: Debe enviar notificación porque el usuario es VIP y adulto
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void checkAndAlertExpiringContent_ShouldNotAlertUnderageUserForAdultContent() {
        // Arrange
        Content adultContent = new Content();
        adultContent.setId("adult-content");
        adultContent.setTitle("Adult Content");
        adultContent.setState(ContentState.PUBLICO);
        adultContent.setAvailableUntil(LocalDate.now().plusDays(7));
        adultContent.setVipOnly(false);
        adultContent.setEdadMinima(18);

        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(List.of(adultContent));
        when(userRepository.findAll()).thenReturn(List.of(kidUser)); // Usuario de 10 años

        // Act
        service.checkAndAlertExpiringContent();

        // Assert: No debe enviar notificación porque el usuario es menor de 18
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // ========== Task 516: Tests para anti-spam ==========

    @Test
    void checkAndAlertExpiringContent_ShouldNotSendDuplicateAlerts() {
        // Arrange
        LocalDate expirationDate = LocalDate.now().plusDays(7);
        when(contentRepository.findByAvailableUntilAndState(expirationDate, ContentState.PUBLICO))
            .thenReturn(List.of(publicContent));
        when(userRepository.findAll()).thenReturn(List.of(adultUser));
        
        // Simular que ya existe una alerta previa
        when(expirationAlertRepository.findByContentIdAndUserIdAndAlertType(
            publicContent.getId(), adultUser.getEmail(), "EXPIRING_SOON"))
            .thenReturn(Optional.of(new ExpirationAlert()));

        // Act
        service.checkAndAlertExpiringContent();

        // Assert: No debe enviar notificación ni guardar alerta (anti-spam)
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(expirationAlertRepository, never()).save(any(ExpirationAlert.class));
    }

    // ========== Task 517: Tests para caducidad de contenido ==========

    @Test
    void processExpiredContent_ShouldHideExpiredContent() {
        // Arrange
        Content expiredContent = new Content();
        expiredContent.setId("expired-1");
        expiredContent.setTitle("Expired Content");
        expiredContent.setState(ContentState.PUBLICO);
        expiredContent.setAvailableUntil(LocalDate.now().minusDays(1)); // Caducó ayer

        when(contentRepository.findByAvailableUntilBeforeAndState(any(LocalDate.class), eq(ContentState.PUBLICO)))
            .thenReturn(List.of(expiredContent));
        when(contentRepository.save(any(Content.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        service.processExpiredContent();

        // Assert: El contenido debe cambiar a PRIVADO
        verify(contentRepository, times(1)).save(any(Content.class));
        assertEquals(ContentState.PRIVADO, expiredContent.getState());
    }

    @Test
    void processExpiredContent_ShouldNotHideFutureContent() {
        // Arrange: No hay contenido vencido
        when(contentRepository.findByAvailableUntilBeforeAndState(any(LocalDate.class), eq(ContentState.PUBLICO)))
            .thenReturn(Collections.emptyList());

        // Act
        service.processExpiredContent();

        // Assert
        verify(contentRepository, never()).save(any(Content.class));
    }

    @Test
    void processExpiredContent_ShouldHideContentExpiringToday() {
        // Arrange
        Content todayContent = new Content();
        todayContent.setId("today-1");
        todayContent.setTitle("Expires Today");
        todayContent.setState(ContentState.PUBLICO);
        todayContent.setAvailableUntil(LocalDate.now()); // Caduca HOY

        when(contentRepository.findByAvailableUntilBeforeAndState(any(LocalDate.class), eq(ContentState.PUBLICO)))
            .thenReturn(List.of(todayContent));
        when(contentRepository.save(any(Content.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        service.processExpiredContent();

        // Assert: El contenido que caduca hoy debe cambiar a PRIVADO
        verify(contentRepository, times(1)).save(any(Content.class));
        assertEquals(ContentState.PRIVADO, todayContent.getState());
    }
}
