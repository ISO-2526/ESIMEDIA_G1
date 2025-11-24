// Validación extraída de ContentForm para reducir complejidad ciclomática.
export function validateContentForm(form, isEdit, creatorContentType) {
  const errs = {};
  const pushErr = (field, msg) => { if (msg) errs[field] = msg; };

  const isVideo = form.type === 'VIDEO';
  const isAudio = form.type === 'AUDIO';

  const rules = [
    ['title', () => {
      if (!form.title?.trim()) return 'El título es obligatorio';
      if (form.title.trim().length > 200) return 'El título no puede superar 200 caracteres';
    }],
    ['type', () => {
      if (creatorContentType && form.type !== creatorContentType)
        return `No estás autorizado para crear contenidos de tipo ${form.type}. Tu tipo es ${creatorContentType}`;
    }],
    ['tags', () => {
      if (!form.tags || form.tags.length === 0) return 'Selecciona al menos una etiqueta';
    }],
    ['durationMinutes', () => {
      const v = form.durationMinutes;
      if (v === '' || v === null || Number(v) <= 0) return 'Duración en minutos debe ser > 0';
      if (Number(v) > 10000) return 'Duración demasiado larga';
    }],
    ['edadMinima', () => {
      const v = form.edadMinima;
      if (v === '' || v === null || isNaN(Number(v))) return 'Edad mínima requerida (0-99)';
      if (v < 0 || v > 99) return 'Edad mínima debe estar entre 0 y 99';
    }],
    ['availableUntil', () => {
      if (!form.availableUntil) return;
      const parsed = Date.parse(form.availableUntil);
      if (isNaN(parsed)) return 'Fecha inválida';
      const selected = new Date(form.availableUntil + 'T00:00:00');
      const today = new Date(); today.setHours(0,0,0,0);
      if (selected < today) return 'La fecha debe ser hoy o futura';
    }],
    ['videoFields', () => {
      if (!isVideo) return;
      if (!form.url || !/^https?:\/\//i.test(form.url)) return 'URL de vídeo válida requerida';
      if (!form.resolution) return 'Resolución requerida';
      if (String(form.resolution).toLowerCase() === '4k' && !form.vipOnly)
        return 'La resolución 4k sólo está disponible para contenidos VIP';
    }],
    ['audioFile', () => {
      if (!isAudio) return;
      if (!isEdit && !form.audioFile) return 'Selecciona un fichero de audio';
    }]
  ];

  for (const [field, rule] of rules) pushErr(field, rule());
  return errs;
}
