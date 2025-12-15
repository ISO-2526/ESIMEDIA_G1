import axios from '../api/axiosConfig';

const API_BASE_URL = '/api/ratings';

/**
 * Servicio para gestionar las valoraciones de contenido.
 * Implementa patrón offline-first con sincronización automática.
 */
class RatingServiceAPI {
  
  /**
   * Guarda o actualiza una valoración (intenta backend primero, fallback a localStorage).
   */
  async saveRating(contentId, rating, contentType = 'video') {
    try {
      // Intentar guardar en el backend
      const response = await axios.post(API_BASE_URL, {
        contentId,
        rating
      }, {
        withCredentials: true
      });

      console.log('✅ Valoración guardada en servidor:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Error al guardar en servidor:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene la valoración del usuario para un contenido.
   */
  async getUserRating(contentId, contentType = 'video') {
    try {
      // Intentar obtener del backend
      const response = await axios.get(`${API_BASE_URL}/user/${contentId}`, {
        withCredentials: true
      });
      if (response.data && response.data.rating !== undefined) {
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Error al obtener del servidor:', error.message);
    }
    return null;
  }

  /**
   * Obtiene las estadísticas de valoración de un contenido.
   */
  async getContentStats(contentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        contentId,
        averageRating: 0.0,
        totalRatings: 0,
        distribution: {}
      };
    }
  }

  /**
   * Obtiene el promedio de valoración de un contenido.
   */
  async getAverageRating(contentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/average/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener promedio:', error);
      return {
        contentId,
        averageRating: 0.0,
        totalRatings: 0
      };
    }
  }

  /**
   * Obtiene los contenidos con mejor valoración (trending).
   */
  async getTrendingContent(minRatings = 5, limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/trending`, {
        params: { minRatings, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener trending:', error);
      return [];
    }
  }

  /**
   * Elimina la valoración del usuario para un contenido.
   */
  async deleteRating(contentId, contentType = 'video') {
    try {
      await axios.delete(`${API_BASE_URL}/${contentId}`, {
        withCredentials: true
      });

      console.log('✅ Valoración eliminada');
      return true;
    } catch (error) {
      console.error('Error al eliminar valoración:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las valoraciones del usuario autenticado.
   */
  async getAllUserRatings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/all`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener valoraciones del usuario:', error);
      return [];
    }
  }

  // Offline/localStorage removido para priorizar sesión por cookies.
}

export default new RatingServiceAPI();
