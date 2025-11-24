import React from 'react';
import PropTypes from 'prop-types';
import { TYPES, TAGS, STATES } from './constants';
import '../CreatorDashboard.css';

export default function ContentFilters({ value, onChange, onNew }) {
  const { query, type, tag, state } = value;

  return (
    <div className="filters">
      <input
        aria-label="Buscar contenidos"
        placeholder="Buscar por título o descripción..."
        value={query}
        onChange={e => onChange({ ...value, query: e.target.value })}
        className="input"
        style={{ flex: 1, minWidth: 220 }}
      />

      <select
        aria-label="Filtrar por tipo"
        value={type}
        onChange={e => onChange({ ...value, type: e.target.value })}
        className="select"
      >
        <option value="ALL">Todos</option>
        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        aria-label="Filtrar por etiqueta"
        value={tag}
        onChange={e => onChange({ ...value, tag: e.target.value })}
        className="select"
      >
        <option value="ALL">Todas</option>
        {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        aria-label="Filtrar por estado"
        value={state}
        onChange={e => onChange({ ...value, state: e.target.value })}
        className="select"
      >
        <option value="ALL">Todos</option>
        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button onClick={onNew} className="btn btn-success" title="Nuevo contenido">Nuevo contenido</button>
    </div>
  );
}

ContentFilters.propTypes = {
  value: PropTypes.shape({
    query: PropTypes.string,
    type: PropTypes.string,
    tag: PropTypes.string,
    state: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
};