import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { TAGS, RESOLUTIONS, TYPES, COVER_OPTIONS, coverToUrl } from './constants';
import '../CreatorDashboard.css';
import { validateContentForm } from './contentValidation';

function getCoverFileName(initialValue) {
  if (!initialValue?.coverUrl) return '';
  return String(initialValue.coverUrl).split('/').pop();
}

function getInitialCover(initialValue) {
  const coverFromUrl = getCoverFileName(initialValue);
  return (initialValue.coverFileName && typeof initialValue.coverFileName === 'string')
    ? initialValue.coverFileName
    : coverFromUrl;
}

function formatAvailableUntil(availableUntil) {
  return availableUntil ? String(availableUntil).slice(0, 10) : '';
}

function buildFormFromInitialValue(initialValue) {
  const initialCover = getInitialCover(initialValue);
  return {
    type: initialValue.type || 'AUDIO',
    vipOnly: initialValue.vipOnly ?? false,
    title: initialValue.title || '',
    description: initialValue.description || '',
    tags: initialValue.tags || [],
    durationMinutes: initialValue.durationMinutes ?? '',
    edadMinima: initialValue.edadMinima ?? '',
    availableUntil: formatAvailableUntil(initialValue.availableUntil),
    url: initialValue.url || '',
    resolution: initialValue.resolution || '',
    audioFile: null,
    coverFileName: initialCover,
  };
}

export default function ContentForm({ mode, initialValue, onSubmit, onCancel, creatorContentType }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    type: creatorContentType || 'AUDIO',
    vipOnly: false,
    title: '',
    description: '',
    tags: [],
    durationMinutes: '',
    edadMinima: '',
    availableUntil: '',
    url: '',
    resolution: '',
    audioFile: null,
    coverFileName: '',
  });

  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    if (initialValue) {
      setForm(buildFormFromInitialValue(initialValue));
    } else if (creatorContentType) {
      setForm((prev) => ({ ...prev, type: creatorContentType }));
    }
  }, [initialValue, creatorContentType]);

  const isVideo = useMemo(() => form.type === 'VIDEO', [form.type]);
  const isAudio = useMemo(() => form.type === 'AUDIO', [form.type]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === 'type' && creatorContentType) return;
    if (type === 'checkbox') {
      setForm(prev => {
        const updated = { ...prev, [name]: Boolean(checked) };
        // Si desactivamos VIP y la resolución actual es 4k, limpiarla
        if (name === 'vipOnly' && !checked && prev.resolution && String(prev.resolution).toLowerCase() === '4k') {
          updated.resolution = '';
        }
        return updated;
      });
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  }

  function handleTagsChange(e) {
    const values = Array.from(e.target.selectedOptions, o => o.value);
    setForm(prev => ({ ...prev, tags: values }));
  }

  function handleFileChange(e) {
    const { name, files } = e.target;
    const file = files?.[0];

    if (file) {
      // Validar tamaño del archivo (máximo 1MB = 1048576 bytes)
      const maxSize = 1048576; // 1MB

      if (file.size > maxSize) {
        const sizeMB = (file.size / 1048576).toFixed(2);
        setFileError(`El archivo es demasiado grande (${sizeMB} MB). Máximo permitido: 1 MB`);
        setForm(prev => ({ ...prev, [name]: null }));
        e.target.value = ''; // Limpiar el input
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Tipo de archivo no permitido. Solo se aceptan archivos de audio (MP3, WAV, OGG, AAC)');
        setForm(prev => ({ ...prev, [name]: null }));
        e.target.value = '';
        return;
      }

      setFileError(null);
      setForm(prev => ({ ...prev, [name]: file }));
    } else {
      setFileError(null);
      setForm(prev => ({ ...prev, [name]: null }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateContentForm(form, isEdit, creatorContentType);
    if (Object.keys(errs).length) {
      alert(Object.values(errs).join('\n'));
      return;
    }
    onSubmit({
      type: form.type,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags,
      durationMinutes: Number(form.durationMinutes),
      edadMinima: Number(form.edadMinima),
      availableUntil: form.availableUntil || null,
      url: isVideo ? form.url.trim() : null,
      resolution: isVideo ? form.resolution : null,
      audioFile: isAudio ? form.audioFile : null,
      coverFileName: form.coverFileName || null,
      vipOnly: !!form.vipOnly,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3 className="section-title">{isEdit ? 'Editar contenido' : 'Nuevo contenido'}</h3>

      <div className="form-row">
        <label htmlFor="type"><b>Tipo</b> <span aria-hidden="true" className="required">*</span></label>
        {/* Si el creador tiene un tipo asignado, mostrarlo como readonly */}
        {creatorContentType ? (
          <div className="field-value readonly">{creatorContentType}</div>
        ) : (
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isEdit}
            className="select"
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      <div className="form-row">
        <label htmlFor="title"><b>Título</b> <span aria-hidden="true" className="required">*</span></label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Título del contenido"
          className="input"
        />
      </div>

      <div className="form-row">
        <label htmlFor="description"><b>Descripción</b></label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Opcional"
          className="textarea"
          rows={4}
        />
      </div>

      {/* Tags (multi-select) */}
      <div className="form-row">
        <label htmlFor="tags"><b>Etiquetas</b> <span aria-hidden="true" className="required">*</span></label>
        <select
          id="tags"
          name="tags"
          multiple
          value={form.tags}
          onChange={handleTagsChange}
          className="select select-multi"
          style={{ minWidth: 240 }}
          aria-describedby="tags-help"
        >
          {TAGS.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <div id="tags-help" className="help-text">
          Mantén Ctrl (Windows) o Cmd (Mac) para seleccionar varias.
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="durationMinutes"><b>Duración (min)</b> <span aria-hidden="true" className="required">*</span></label>
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          step={1}
          value={form.durationMinutes}
          onChange={handleChange}
          className="input"
          placeholder=""
          style={{ width: 120 }}
        />
      </div>

      <div className="form-row">
        <label htmlFor="edadMinima"><b>Edad mínima</b> <span aria-hidden="true" className="required">*</span></label>
        <input
          id="edadMinima"
          name="edadMinima"
          type="number"
          min={0}
          max={99}
          step={1}
          value={form.edadMinima}
          onChange={handleChange}
          className="input"
          placeholder=""
          style={{ width: 120 }}
        />
      </div>

      <div className="form-row">
        <label htmlFor="availableUntil"><b>Disponible hasta</b></label>
        <input
          id="availableUntil"
          name="availableUntil"
          type="date"
          value={form.availableUntil || ''}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start' }}>
        <label htmlFor="vipOnly" style={{ margin: 0, whiteSpace: 'nowrap' }}><b>VIP</b></label>
        <div style={{ flex: '0 0 auto', display: 'inline-block' }}>
          <input
            id="vipOnly"
            name="vipOnly"
            type="checkbox"
            checked={!!form.vipOnly}
            onChange={handleChange}
            style={{ marginLeft: 8, width: 16, height: 16, display: 'inline-block', flex: '0 0 auto' }}
          />
        </div>
        <div className="help-text" style={{ margin: 0 }}></div>
      </div>

      {isVideo && (
        <>
          <div className="form-row">
            <label htmlFor="url"><b>URL del vídeo</b> <span aria-hidden="true" style={{ color: '#c00' }}>*</span></label>
            <input
              id="url"
              name="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://..."
              disabled={isEdit}
              className="input"
            />
            {isEdit && initialValue?.url && (
              <div className="help-text">Actual: {initialValue.url} (no editable)</div>
            )}
          </div>
          <div className="form-row">
            <label htmlFor="resolution"><b>Resolución</b> <span aria-hidden="true" style={{ color: '#c00' }}>*</span></label>
            <select
              id="resolution"
              name="resolution"
              value={form.resolution}
              onChange={handleChange}
              disabled={isEdit}
              className="select"
            >
              <option value="">Selecciona</option>
              {RESOLUTIONS.map(r => (
                <option
                  key={r}
                  value={r}
                  disabled={String(r).toLowerCase() === '4k' && !form.vipOnly}
                >
                  {r}{String(r).toLowerCase() === '4k' && !form.vipOnly ? ' (solo VIP)' : ''}
                </option>
              ))}
            </select>
            {isEdit && initialValue?.resolution && (
              <div className="help-text">Actual: {initialValue.resolution} (no editable)</div>
            )}
            {!form.vipOnly && (
              <div className="help-text" style={{ marginTop: 6 }}>La resolución 4k sólo está disponible para contenidos marcados como VIP.</div>
            )}
          </div>
        </>
      )}

      {isAudio && (
        <div className="form-row">
          <label htmlFor="audioFile">
            <b>Fichero (audio)</b> {!isEdit && <span aria-hidden="true" style={{ color: '#c00' }}>*</span>}
            <span style={{ fontSize: '0.85em', marginLeft: '8px', color: '#666' }}>
              (Máx: 1 MB)
            </span>
          </label>
          <input
            id="audioFile"
            name="audioFile"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac"
            onChange={handleFileChange}
            disabled={isEdit}
            style={{ marginBottom: '8px' }}
          />
          {form.audioFile && (
            <div className="help-text" style={{ color: '#4CAF50', marginTop: '4px' }}>
              ✓ Archivo seleccionado: {form.audioFile.name} ({(form.audioFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
          {fileError && (
            <div className="help-text" style={{ color: '#f44336', marginTop: '4px' }}>
              ⚠ {fileError}
            </div>
          )}
          {isEdit && initialValue?.audioFileName && (
            <div className="help-text">Actual: {initialValue.audioFileName} (no editable)</div>
          )}
        </div>
      )}

      <fieldset className="form-row" style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 500, marginBottom: 6 }}>Carátula</legend>
        <div className="avatar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 10 }}>
          {COVER_OPTIONS.map((name) => {
            const id = `cover_${name}`;
            const selected = form.coverFileName === name;
            return (
              <label key={name} htmlFor={id} className={`avatar-option ${selected ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                <input
                  id={id}
                  type="radio"
                  name="cover"
                  value={name}
                  checked={selected}
                  onChange={() => setForm((p) => ({ ...p, coverFileName: name }))}
                  style={{ display: 'none' }}
                />
                <img src={coverToUrl(name)} alt={`Carátula ${name}`} className="thumbnail" />
              </label>
            );
          })}
        </div>
        {form.coverFileName && (
          <div className="help-text" style={{ marginTop: 6 }}>
            Seleccionado: {form.coverFileName}
          </div>
        )}
      </fieldset>

      <div className="profile-actions">
        <button type="submit" className="btn btn-primary">{isEdit ? 'Guardar cambios' : 'Crear contenido'}</button>
        <button type="button" onClick={onCancel} className="btn btn-neutral">Cancelar</button>
      </div>
    </form>
  );
}

ContentForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  creatorContentType: PropTypes.oneOf(['AUDIO', 'VIDEO']),
};