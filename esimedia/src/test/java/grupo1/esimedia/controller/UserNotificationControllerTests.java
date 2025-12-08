package grupo1.esimedia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import grupo1.esimedia.model.UserNotification;
import grupo1.esimedia.service.UserNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas unitarias para UserNotificationController.
 * Tarea 529 - HDU 494
 */
@WebMvcTest(UserNotificationController.class)
@WithMockUser
class UserNotificationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserNotificationService userNotificationService;

    @Autowired
    private ObjectMapper objectMapper;

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
    void getAllNotifications_Returns200AndNotificationsList() throws Exception {
        // Arrange
        List<UserNotification> notifications = Arrays.asList(notification1, notification2);
        when(userNotificationService.getNotificationsByUserId(TEST_USER_ID)).thenReturn(notifications);

        // Act & Assert
        mockMvc.perform(get("/api/notifications")
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Test Title 1"));

        verify(userNotificationService, times(1)).getNotificationsByUserId(TEST_USER_ID);
    }

    @Test
    void getUnreadNotifications_Returns200AndUnreadList() throws Exception {
        // Arrange
        when(userNotificationService.getUnreadNotifications(TEST_USER_ID))
                .thenReturn(List.of(notification1));

        // Act & Assert
        mockMvc.perform(get("/api/notifications/unread")
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(userNotificationService, times(1)).getUnreadNotifications(TEST_USER_ID);
    }

    @Test
    void getUnreadCount_Returns200AndCount() throws Exception {
        // Arrange
        when(userNotificationService.getUnreadNotificationCount(TEST_USER_ID)).thenReturn(5L);

        // Act & Assert
        mockMvc.perform(get("/api/notifications/unread/count")
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));

        verify(userNotificationService, times(1)).getUnreadNotificationCount(TEST_USER_ID);
    }

    @Test
    void getNotification_Returns200WhenFound() throws Exception {
        // Arrange
        when(userNotificationService.getNotificationById(TEST_NOTIFICATION_ID))
                .thenReturn(Optional.of(notification1));

        // Act & Assert
        mockMvc.perform(get("/api/notifications/{notificationId}", TEST_NOTIFICATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(TEST_NOTIFICATION_ID))
                .andExpect(jsonPath("$.title").value("Test Title 1"));

        verify(userNotificationService, times(1)).getNotificationById(TEST_NOTIFICATION_ID);
    }

    @Test
    void getNotification_Returns404WhenNotFound() throws Exception {
        // Arrange
        when(userNotificationService.getNotificationById("nonexistent"))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/notifications/{notificationId}", "nonexistent"))
                .andExpect(status().isNotFound());

        verify(userNotificationService, times(1)).getNotificationById("nonexistent");
    }

    @Test
    void createNotification_Returns201AndCreatedNotification() throws Exception {
        // Arrange
        UserNotification newNotification = new UserNotification(TEST_USER_ID, "New Title", "New Message", "SUCCESS");
        newNotification.setId("newId");
        when(userNotificationService.createNotification(any(UserNotification.class)))
                .thenReturn(newNotification);

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newNotification)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Title"))
                .andExpect(jsonPath("$.type").value("SUCCESS"));

        verify(userNotificationService, times(1)).createNotification(any(UserNotification.class));
    }

    @Test
    void markAsRead_Returns200WhenSuccess() throws Exception {
        // Arrange
        notification1.setRead(true);
        when(userNotificationService.markAsRead(TEST_NOTIFICATION_ID))
                .thenReturn(Optional.of(notification1));

        // Act & Assert
        mockMvc.perform(put("/api/notifications/{notificationId}/read", TEST_NOTIFICATION_ID)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));

        verify(userNotificationService, times(1)).markAsRead(TEST_NOTIFICATION_ID);
    }

    @Test
    void markAsRead_Returns404WhenNotFound() throws Exception {
        // Arrange
        when(userNotificationService.markAsRead("nonexistent"))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/notifications/{notificationId}/read", "nonexistent")
                        .with(csrf()))
                .andExpect(status().isNotFound());

        verify(userNotificationService, times(1)).markAsRead("nonexistent");
    }

    @Test
    void markAllAsRead_Returns200() throws Exception {
        // Arrange
        doNothing().when(userNotificationService).markAllAsRead(TEST_USER_ID);

        // Act & Assert
        mockMvc.perform(put("/api/notifications/read-all")
                        .with(csrf())
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk());

        verify(userNotificationService, times(1)).markAllAsRead(TEST_USER_ID);
    }

    @Test
    void deleteNotification_Returns204() throws Exception {
        // Arrange
        doNothing().when(userNotificationService).deleteNotification(TEST_NOTIFICATION_ID);

        // Act & Assert
        mockMvc.perform(delete("/api/notifications/{notificationId}", TEST_NOTIFICATION_ID)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(userNotificationService, times(1)).deleteNotification(TEST_NOTIFICATION_ID);
    }

    @Test
    void deleteAllNotifications_Returns204() throws Exception {
        // Arrange
        doNothing().when(userNotificationService).deleteAllNotificationsByUserId(TEST_USER_ID);

        // Act & Assert
        mockMvc.perform(delete("/api/notifications")
                        .with(csrf())
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isNoContent());

        verify(userNotificationService, times(1)).deleteAllNotificationsByUserId(TEST_USER_ID);
    }
}
