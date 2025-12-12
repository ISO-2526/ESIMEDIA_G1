/**
 * Servicio de notificaciones para gestionar notificaciones del sistema.
 *
 * Tipos de notificaciones soportados:
 * - Sistema: Notificaciones del sistema (type: 'system')
 * - Contenido: Notificaciones de contenido nuevo (type: 'content')
 * - Recomendación: Notificaciones de contenido recomendado (type: 'recommendation')
 *
 * Para crear notificaciones de contenido, usar createContentNotification():
 * @example
 * // Notificación de video
 * notificationService.createContentNotification(
 *   "507f1f77bcf86cd799439011",
 *   "video",
 *   "Nuevo video disponible",
 *   "Se ha publicado un nuevo video"
 * );
 *
 * // Notificación de audio
 * notificationService.createContentNotification(
 *   "507f191e810c19729de860ea",
 *   "audio",
 *   "Nuevo podcast",
 *   "Nuevo episodio disponible"
 * );
 *
 * Para notificaciones del sistema, usar addNotification() directamente:
 * @example
 * notificationService.addNotification({
 *   title: "Perfil actualizado",
 *   message: "Tu perfil ha sido actualizado correctamente",
 *   type: "system"
 * });
 */
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Obtener todas las notificaciones
  getNotifications() {
    return [...this.notifications];
  }

  // Añadir una nueva notificación
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification); // Añadir al principio (más reciente arriba)
    this.notifyListeners();
    return newNotification;
  }

  // Marcar notificación como leída
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  // Eliminar notificación
  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  // Limpiar todas las notificaciones
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Suscribirse a cambios
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Obtener notificaciones no leídas
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Simular carga de notificaciones desde API
  async loadNotifications() {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Limpiar notificaciones existentes para evitar duplicados
    this.notifications = [];

    // Notificación de video con ID real
    this.createContentNotification(
      "691e7d59b73ec548ba251917",
      "video",
      "Nuevo video disponible",
      "Se ha publicado un nuevo video en tu lista de favoritos"
    );

    // Notificación de audio con ID real
    this.createContentNotification(
      "691a43848ba5a6da7525fcd4",
      "audio",
      "Nuevo audio recomendado",
      "Te recomendamos este nuevo episodio de podcast"
    );

    return this.notifications;
  }

  // Crear notificación de contenido
  createContentNotification(contentId, contentType, title, message, notificationType = 'content') {
    if (!contentId || !contentType) {
      console.error('❌ Error: contentId y contentType son requeridos para crear notificación de contenido');
      return null;
    }

    const validContentTypes = ['video', 'audio', 'playlist'];
    if (!validContentTypes.includes(contentType)) {
      console.error(`❌ Error: contentType '${contentType}' no válido. Debe ser uno de: ${validContentTypes.join(', ')}`);
      return null;
    }

    return this.addNotification({
      title: title || `Nuevo contenido ${contentType} disponible`,
      message: message || `Haz clic para reproducir el contenido`,
      type: notificationType,
      contentId,
      contentType
    });
  }
}

// Instancia singleton
const notificationService = new NotificationService();

export default notificationService;