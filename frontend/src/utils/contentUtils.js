// Utilidades extraídas desde UserDashboard para reducir complejidad ciclomática
// Mantienen exactamente la misma lógica previa.

export const filterBySearch = (list, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) return list;
  const q = searchQuery.toLowerCase();
  return list.filter(item =>
    item.title?.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)))
  );
};

export const filterByCategories = (list, categories) => {
  if (!categories || !categories.length) return list;
  return list.filter(item => item.tags && item.tags.some(tag => categories.includes(tag)));
};

export const filterByYearRange = (list, yearRange) => {
  if (!yearRange) return list;
  const currentYear = new Date().getFullYear();
  if (yearRange.min <= 2000 && yearRange.max >= currentYear) return list;
  return list.filter(item => {
    const year = item.createdAt ? new Date(item.createdAt).getFullYear() : currentYear;
    return year >= yearRange.min && year <= yearRange.max;
  });
};

export const filterByDuration = (list, durationRange, defaultMin = 0, defaultMax = 180) => {
  if (!durationRange) return list;
  if (durationRange.min === defaultMin && durationRange.max === defaultMax) return list;
  return list.filter(item => {
    const duration = item.durationMinutes || 0;
    const meetsMin = duration >= durationRange.min;
    const meetsMax = durationRange.max < defaultMax ? duration <= durationRange.max : true;
    return meetsMin && meetsMax;
  });
};

export const filterByMinRating = (list, minRating) => {
  if (!minRating) return list;
  return list.filter(item => (item.ratingStars || 0) >= minRating);
};

export const SORT_COMPARATORS = {
  rating: { log: 'Ordenando por rating...', cmp: (a, b) => (b.ratingStars || 0) - (a.ratingStars || 0) },
  views: { log: 'Ordenando por vistas...', cmp: (a, b) => (b.viewCount || 0) - (a.viewCount || 0) },
  'duration-asc': {
    log: 'Ordenando por duración ascendente...',
    cmp: (a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0)
  },
  'duration-desc': {
    log: 'Ordenando por duración descendente...',
    cmp: (a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0)
  },
  recent: {
    log: 'Ordenando por más reciente...',
    cmp: (a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    }
  }
};

export function determineCategoryFromTags(tags) {
  if (!tags || tags.length === 0) return 'General';
  const tag = tags[0].toLowerCase();
  if (tag.includes('serie')) return 'Serie';
  if (tag.includes('pelicula') || tag.includes('película') || tag.includes('film')) return 'Película';
  if (tag.includes('documental')) return 'Documental';
  if (tag.includes('infantil') || tag.includes('niños') || tag.includes('kids')) return 'Infantil';
  return 'General';
}

export function extractYearFromDate(publishDate) {
  if (!publishDate) return new Date().getFullYear();
  const publishYear = new Date(publishDate).getFullYear();
  return isNaN(publishYear) ? new Date().getFullYear() : publishYear;
}

export function transformContent(content) {
  const categoria = determineCategoryFromTags(content.tags);
  const year = extractYearFromDate(content.publishDate);
  return {
    id: content.id,
    titulo: content.title,
    imagen: content.coverFileName ? `/cover/${content.coverFileName}` : '/cover/default.png',
    categoria,
    year: year.toString(),
    duration: content.durationMinutes ? `${content.durationMinutes}m` : 'N/A',
    rating: content.edadMinima ? `${content.edadMinima}+` : 'TP',
    ratingStars: content.ratingStars || 0,
    description: content.description || 'Sin descripción disponible',
    videoUrl: content.url,
    audioFileName: content.audioFileName,
    tags: content.tags || [],
    creatorAlias: content.creatorAlias,
    type: content.type || 'VIDEO',
    vipOnly: content.vipOnly || false,
    isVip: content.isVip || false,
    durationMinutes: content.durationMinutes || 0,
    viewCount: content.viewCount || 0,
    createdAt: content.createdAt || content.publishDate,
    title: content.title
  };
}

export function isVipBlocked(content, isVipUser) {
  return content.vipOnly && !isVipUser;
}

export function missingMediaMessage(content) {
  if (content.type === 'AUDIO' && !content.audioFileName) return '⚠️ Este contenido no tiene un archivo de audio configurado';
  if (content.type === 'VIDEO' && !content.videoUrl) return '⚠️ Este contenido no tiene una URL de video configurada';
  return null;
}
