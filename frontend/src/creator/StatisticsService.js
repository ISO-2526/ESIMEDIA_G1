const API_URL = '/api/creator/statistics';

export const StatisticsService = {
  // Top 5 contenidos por reproducciones
  getTopByViews: async () => {
    const res = await fetch(`${API_URL}/top-views`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener top por reproducciones');
    return res.json();
  },

  // Top 5 contenidos por valoraciones (media de valoraciones)
  getTopByRatings: async () => {
    const res = await fetch(`${API_URL}/top-ratings`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener top por valoraciones');
    return res.json();
  },

  // Top 5 categorías (especialidades) más vistas
  getTopByCategories: async () => {
    const res = await fetch(`${API_URL}/top-categories`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener top por categorías');
    return res.json();
  },
};
