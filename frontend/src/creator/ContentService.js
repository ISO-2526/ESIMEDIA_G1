const API_URL = '/api/creator/contents';

export const ContentService = {
  getAll: async () => {
    const res = await fetch(API_URL, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener contenidos');
    return res.json();
  },

  getByCreator: async (alias) => {
    const res = await fetch(`${API_URL}/creator/${alias}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener contenidos del creador');
    return res.json();
  },

  create: async (content) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      let msg = 'Error al crear contenido';
      try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) { try { const t = await res.text(); if (t) msg = t; } catch (_) { } }
      throw new Error(msg);
    }
    return res.json();
  },

  update: async (id, content) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      let msg = 'Error al actualizar contenido';
      try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) { try { const t = await res.text(); if (t) msg = t; } catch (_) { } }
      throw new Error(msg);
    }
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      let msg = 'Error al eliminar contenido';
      try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) { try { const t = await res.text(); if (t) msg = t; } catch (_) { } }
      throw new Error(msg);
    }
  },
};
