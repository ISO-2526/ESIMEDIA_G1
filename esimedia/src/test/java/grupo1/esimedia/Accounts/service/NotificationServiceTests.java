package grupo1.esimedia.Accounts.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

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

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void notifyUsersWithMatchingTags_ShouldNotifyMatchingUser() {
        // Arrange
        Content content = new Content();
        content.setId("c1");
        content.setTitle("Action Movie");
        content.setTags(List.of("ACTION"));
        content.setVipOnly(false);
        content.setEdadMinima(0);

        User user = new User();
        user.setEmail("user@test.com");
        user.setTags(List.of("ACTION", "COMEDY"));

        when(userRepository.findAll()).thenReturn(List.of(user));

        // Act
        notificationService.notifyUsersWithMatchingTags(content);

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void notifyUsersWithMatchingTags_ShouldNotNotifyNonMatchingUser() {
        // Arrange
        Content content = new Content();
        content.setTags(List.of("HORROR"));

        User user = new User();
        user.setTags(List.of("COMEDY"));

        when(userRepository.findAll()).thenReturn(List.of(user));

        // Act
        notificationService.notifyUsersWithMatchingTags(content);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersWithMatchingTags_ShouldFilterByAge() {
        // Arrange
        Content content = new Content();
        content.setTags(List.of("ACTION"));
        content.setEdadMinima(18);

        User kid = new User();
        kid.setTags(List.of("ACTION"));
        // 10 years old
        kid.setDateOfBirth(LocalDate.now().minusYears(10).toString());

        when(userRepository.findAll()).thenReturn(List.of(kid));

        // Act
        notificationService.notifyUsersWithMatchingTags(content);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersWithMatchingTags_ShouldFilterByVip() {
        // Arrange
        Content content = new Content();
        content.setTags(List.of("ACTION"));
        content.setVipOnly(true);

        User regularUser = new User();
        regularUser.setTags(List.of("ACTION"));
        regularUser.setVip(false);

        when(userRepository.findAll()).thenReturn(List.of(regularUser));

        // Act
        notificationService.notifyUsersWithMatchingTags(content);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersWithMatchingTags_ShouldNotifyVipUserForVipContent() {
        // Arrange
        Content content = new Content();
        content.setId("c2");
        content.setTitle("VIP Movie");
        content.setTags(List.of("ACTION"));
        content.setVipOnly(true);

        User vipUser = new User();
        vipUser.setEmail("vip@test.com");
        vipUser.setTags(List.of("ACTION"));
        vipUser.setVip(true);

        when(userRepository.findAll()).thenReturn(List.of(vipUser));

        // Act
        notificationService.notifyUsersWithMatchingTags(content);

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }
}
