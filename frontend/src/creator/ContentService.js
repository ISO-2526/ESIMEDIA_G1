import axios from '../api/axiosConfig';

const API_URL = '/api/creator/contents';

export const ContentService = {
  getAll: async () => {
    const res = await axios.get(API_URL, { withCredentials: true });
    return res.data;
  },

  getByCreator: async (alias) => {
    const res = await axios.get(`${API_URL}/creator/${alias}`, { withCredentials: true });
    return res.data;
  },

  create: async (content) => {
    try {
      const res = await axios.post(API_URL, content, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (error) {
      let msg = 'Error al crear contenido';
      if (error.response?.data) {
        const d = error.response.data;
        msg = (typeof d === 'string' ? d : d.message) || msg;
      }
      throw new Error(msg);
    }
  },

  update: async (id, content) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, content, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (error) {
      let msg = 'Error al actualizar contenido';
      if (error.response?.data) {
        const d = error.response.data;
        msg = (typeof d === 'string' ? d : d.message) || msg;
      }
      throw new Error(msg);
    }
  },

  delete: async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    } catch (error) {
      let msg = 'Error al eliminar contenido';
      if (error.response?.data) {
        const d = error.response.data;
        msg = (typeof d === 'string' ? d : d.message) || msg;
      }
      throw new Error(msg);
    }
  },
};
