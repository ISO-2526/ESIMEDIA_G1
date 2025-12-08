package grupo1.esimedia.service;

import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.repository.UserNotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para UserNotificationService.
 * Tarea 529 - HDU 494
 */
@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTests {

    @Mock
    private UserNotificationRepository userNotificationRepository;

    @InjectMocks
    private UserNotificationService userNotificationService;

    private UserNotification notification1;
    private UserNotification notification2;
    private final String TEST_USER_ID = "user123";
    private final String TEST_NOTIFICATION_ID = "notif123";

    @BeforeEach
    void setUp() {
        notification1 = new UserNotification(TEST_USER_ID, "Test Title 1", "Test Message 1", "INFO");
        notification1.setId(TEST_NOTIFICATION_ID);
        notification1.setRead(false);

        notification2 = new UserNotification(TEST_USER_ID, "Test Title 2", "Test Message 2", "WARNING");
        notification2.setId("notif456");
        notification2.setRead(false);
    }

    @Test
    void getNotificationsByUserId_ReturnsUserNotifications() {
        // Arrange
        List<UserNotification> expectedNotifications = Arrays.asList(notification1, notification2);
        when(userNotificationRepository.findByUserIdOrderByCreatedAtDesc(TEST_USER_ID))
                .thenReturn(expectedNotifications);

        // Act
        List<UserNotification> result = userNotificationService.getNotificationsByUserId(TEST_USER_ID);

        // Assert
        assertEquals(2, result.size());
        assertEquals(notification1.getTitle(), result.get(0).getTitle());
        verify(userNotificationRepository, times(1)).findByUserIdOrderByCreatedAtDesc(TEST_USER_ID);
    }

    @Test
    void getNotificationsByUserId_ReturnsEmptyListWhenNoNotifications() {
        // Arrange
        when(userNotificationRepository.findByUserIdOrderByCreatedAtDesc(TEST_USER_ID))
                .thenReturn(List.of());

        // Act
        List<UserNotification> result = userNotificationService.getNotificationsByUserId(TEST_USER_ID);

        // Assert
        assertTrue(result.isEmpty());
        verify(userNotificationRepository, times(1)).findByUserIdOrderByCreatedAtDesc(TEST_USER_ID);
    }

    @Test
    void getUnreadNotifications_ReturnsOnlyUnreadNotifications() {
        // Arrange
        List<UserNotification> unreadNotifications = Arrays.asList(notification1, notification2);
        when(userNotificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(TEST_USER_ID))
                .thenReturn(unreadNotifications);

        // Act
        List<UserNotification> result = userNotificationService.getUnreadNotifications(TEST_USER_ID);

        // Assert
        assertEquals(2, result.size());
        assertFalse(result.get(0).getRead());
        verify(userNotificationRepository, times(1)).findByUserIdAndReadFalseOrderByCreatedAtDesc(TEST_USER_ID);
    }

    @Test
    void getNotificationById_ReturnsNotificationWhenExists() {
        // Arrange
        when(userNotificationRepository.findById(TEST_NOTIFICATION_ID))
                .thenReturn(Optional.of(notification1));

        // Act
        Optional<UserNotification> result = userNotificationService.getNotificationById(TEST_NOTIFICATION_ID);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(TEST_NOTIFICATION_ID, result.get().getId());
        verify(userNotificationRepository, times(1)).findById(TEST_NOTIFICATION_ID);
    }

    @Test
    void getNotificationById_ReturnsEmptyWhenNotExists() {
        // Arrange
        when(userNotificationRepository.findById("nonexistent"))
                .thenReturn(Optional.empty());

        // Act
        Optional<UserNotification> result = userNotificationService.getNotificationById("nonexistent");

        // Assert
        assertFalse(result.isPresent());
        verify(userNotificationRepository, times(1)).findById("nonexistent");
    }

    @Test
    void createNotification_SavesAndReturnsNotification() {
        // Arrange
        UserNotification newNotification = new UserNotification(TEST_USER_ID, "New Title", "New Message", "SUCCESS");
        when(userNotificationRepository.save(any(UserNotification.class)))
                .thenReturn(newNotification);

        // Act
        UserNotification result = userNotificationService.createNotification(newNotification);

        // Assert
        assertNotNull(result);
        assertEquals("New Title", result.getTitle());
        assertEquals("SUCCESS", result.getType());
        verify(userNotificationRepository, times(1)).save(newNotification);
    }

    @Test
    void markAsRead_UpdatesReadStatusToTrue() {
        // Arrange
        when(userNotificationRepository.findById(TEST_NOTIFICATION_ID))
                .thenReturn(Optional.of(notification1));
        when(userNotificationRepository.save(any(UserNotification.class)))
                .thenReturn(notification1);

        // Act
        Optional<UserNotification> result = userNotificationService.markAsRead(TEST_NOTIFICATION_ID);

        // Assert
        assertTrue(result.isPresent());
        assertTrue(result.get().getRead());
        assertNotNull(result.get().getReadAt());
        verify(userNotificationRepository, times(1)).findById(TEST_NOTIFICATION_ID);
        verify(userNotificationRepository, times(1)).save(any(UserNotification.class));
    }

    @Test
    void markAsRead_ReturnsEmptyWhenNotificationNotFound() {
        // Arrange
        when(userNotificationRepository.findById("nonexistent"))
                .thenReturn(Optional.empty());

        // Act
        Optional<UserNotification> result = userNotificationService.markAsRead("nonexistent");

        // Assert
        assertFalse(result.isPresent());
        verify(userNotificationRepository, times(1)).findById("nonexistent");
        verify(userNotificationRepository, never()).save(any(UserNotification.class));
    }

    @Test
    void markAllAsRead_UpdatesAllNotificationsForUser() {
        // Arrange
        List<UserNotification> unreadNotifications = Arrays.asList(notification1, notification2);
        when(userNotificationRepository.findByUserIdAndReadFalse(TEST_USER_ID))
                .thenReturn(unreadNotifications);

        // Act
        userNotificationService.markAllAsRead(TEST_USER_ID);

        // Assert
        verify(userNotificationRepository, times(1)).findByUserIdAndReadFalse(TEST_USER_ID);
        verify(userNotificationRepository, times(2)).save(any(UserNotification.class));
    }

    @Test
    void deleteNotification_RemovesNotificationById() {
        // Arrange
        doNothing().when(userNotificationRepository).deleteById(TEST_NOTIFICATION_ID);

        // Act
        userNotificationService.deleteNotification(TEST_NOTIFICATION_ID);

        // Assert
        verify(userNotificationRepository, times(1)).deleteById(TEST_NOTIFICATION_ID);
    }

    @Test
    void deleteAllNotificationsByUserId_RemovesAllForUser() {
        // Arrange
        doNothing().when(userNotificationRepository).deleteByUserId(TEST_USER_ID);

        // Act
        userNotificationService.deleteAllNotificationsByUserId(TEST_USER_ID);

        // Assert
        verify(userNotificationRepository, times(1)).deleteByUserId(TEST_USER_ID);
    }

    @Test
    void getUnreadNotificationCount_ReturnsCorrectCount() {
        // Arrange
        when(userNotificationRepository.countByUserIdAndReadFalse(TEST_USER_ID))
                .thenReturn(5L);

        // Act
        long result = userNotificationService.getUnreadNotificationCount(TEST_USER_ID);

        // Assert
        assertEquals(5L, result);
        verify(userNotificationRepository, times(1)).countByUserIdAndReadFalse(TEST_USER_ID);
    }

    @Test
    void getUnreadNotificationCount_ReturnsZeroWhenNoUnread() {
        // Arrange
        when(userNotificationRepository.countByUserIdAndReadFalse(TEST_USER_ID))
                .thenReturn(0L);

        // Act
        long result = userNotificationService.getUnreadNotificationCount(TEST_USER_ID);

        // Assert
        assertEquals(0L, result);
        verify(userNotificationRepository, times(1)).countByUserIdAndReadFalse(TEST_USER_ID);
    }
}
