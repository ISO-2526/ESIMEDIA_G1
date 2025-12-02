import axios from '../api/axiosConfig';

const API_BASE_URL = '/api/views';

/**
 * Servicio para gestionar las reproducciones de contenido.
 */
class ViewCountServiceAPI {
  
  /**
   * Registra una reproducción de contenido.
   */
  async registerView(contentId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/${contentId}`);
      console.log(`👁️ Reproducción registrada para contenido ${contentId} - Total: ${response.data.totalViews}`);
      return response.data;
    } catch (error) {
      console.error('Error al registrar reproducción:', error);
      throw error;
    }
  }

  /**
   * Obtiene el contador de reproducciones de un contenido.
   */
  async getViewCount(contentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${contentId}`);
      return response.data.totalViews;
    } catch (error) {
      console.error('Error al obtener reproducciones:', error);
      return 0;
    }
  }

  /**
   * Obtiene solo el total de reproducciones de un contenido.
   */
  async getTotalViews(contentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${contentId}/total`);
      return response.data.totalViews;
    } catch (error) {
      console.error('Error al obtener total de reproducciones:', error);
      return 0;
    }
  }
}

export default new ViewCountServiceAPI();
