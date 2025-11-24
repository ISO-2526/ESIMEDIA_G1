import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../CreatorDashboard.css';

// Helper: calcula restricciones por tipo
function getTypeRestriction(contentType, creatorContentType) {
  const disabledByType = creatorContentType
    ? String(contentType).toUpperCase() !== String(creatorContentType).toUpperCase()
    : false;
  const reason = disabledByType ? 'Solo puedes modificar contenidos de tu mismo tipo' : undefined;
  return { disabledByType, reason };
}

export default function ContentList({ items, onEdit, onPublish, onUnpublish, onDelete, onAddToPlaylist, creatorContentType }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        closeMenu();
      }
    };
    
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div style={{ marginTop: 18, overflowX: 'auto', overflowY: 'visible' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Portada</th>
            <th>Título</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th className="hide-sm">Fecha estado</th>
            <th className="hide-xs">Tags</th>
            <th className="actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(!items || items.length === 0) && (
            <tr>
              <td colSpan={7}>Aún no hay contenidos.</td>
            </tr>
          )}
          {items?.map((c) => (
            <tr key={c.id}>
              <td>
                {(() => {
                  const coverSrc = c.coverUrl || (c.coverFileName ? `/cover/${c.coverFileName}` : null);
                  if (coverSrc) {
                    return (
                      <img
                        src={coverSrc}
                        alt={`Carátula de ${c.title}`}
                        loading="lazy"
                        className="thumbnail"
                      />
                    );
                  }
                  return (
                    <span aria-label={c.type === 'VIDEO' ? 'Vídeo' : 'Audio'} title={c.type} style={{ fontSize: 22 }}>
                      {c.type === 'VIDEO' ? '🎬' : '🎧'}
                    </span>
                  );
                })()}
                {c.type === 'AUDIO' && c.audioFileName && (
                  <div className="audio-chip" title={c.audioFileName}>
                    {c.audioFileName}
                  </div>
                )}
              </td>
              <td>{c.title}</td>
              <td>{c.type}</td>
              <td>{c.state}</td>
              <td className="hide-sm" title={c.stateChangedAt || ''}>
                {c.stateChangedAt ? new Date(c.stateChangedAt).toLocaleString() : '—'}
              </td>
              <td className="hide-xs">{(c.tags || []).join(', ')}</td>
              <td className="actions">
                {/* Reducido: extraído a componente para bajar la complejidad */}
                <RowActions
                  c={c}
                  onAddToPlaylist={onAddToPlaylist}
                  creatorContentType={creatorContentType}
                  isMenuOpen={openMenuId === c.id}
                  toggleMenu={toggleMenu}
                  closeMenu={closeMenu}
                  onEdit={onEdit}
                  onPublish={onPublish}
                  onUnpublish={onUnpublish}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ContentList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
      stateChangedAt: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddToPlaylist: PropTypes.func,
  creatorContentType: PropTypes.string,
};

function RowActions({
  c,
  onAddToPlaylist,
  creatorContentType,
  isMenuOpen,
  toggleMenu,
  closeMenu,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}) {
  const { disabledByType, reason } = getTypeRestriction(c.type, creatorContentType);

  const actions = [
    {
      key: 'edit',
      label: 'Editar',
      icon: 'fas fa-edit',
      disabled: disabledByType,
      title: disabledByType ? reason : 'Editar',
      color: disabledByType ? 'var(--creator-text-muted, #888)' : 'var(--creator-text-primary, #fff)',
      canHover: !disabledByType,
      onClick: () => onEdit(c.id),
    },
    {
      key: 'publish',
      label: 'Publicar',
      icon: 'fas fa-eye',
      disabled: disabledByType || c.state === 'PUBLICO',
      title: disabledByType ? reason : 'Publicar',
      color: (disabledByType || c.state === 'PUBLICO') ? 'var(--creator-text-muted, #888)' : 'var(--creator-text-primary, #fff)',
      canHover: !disabledByType && c.state !== 'PUBLICO',
      onClick: () => onPublish(c.id),
    },
    {
      key: 'unpublish',
      label: 'Hacer Privado',
      icon: 'fas fa-eye-slash',
      disabled: disabledByType || c.state !== 'PUBLICO',
      title: disabledByType ? reason : 'Hacer Privado',
      color: (disabledByType || c.state !== 'PUBLICO') ? 'var(--creator-text-muted, #888)' : 'var(--creator-text-primary, #fff)',
      canHover: !disabledByType && c.state === 'PUBLICO',
      onClick: () => onUnpublish(c.id),
    },
    { key: 'divider', divider: true },
    {
      key: 'delete',
      label: 'Borrar',
      icon: 'fas fa-trash',
      disabled: disabledByType,
      title: disabledByType ? reason : 'Borrar',
      color: disabledByType ? 'var(--creator-text-muted, #888)' : 'var(--creator-danger, #ef4444)',
      canHover: !disabledByType,
      onClick: () => onDelete(c.id),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
      {onAddToPlaylist && (
        <button
          onClick={() => onAddToPlaylist(c)}
          className="btn btn-primary"
          title="Añadir a lista"
        >
          <i className="fas fa-plus"></i>
        </button>
      )}
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu(c.id);
          }}
          className="btn btn-neutral"
          title="Más opciones"
          style={{ padding: '6px 12px' }}
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
        {isMenuOpen && (
          <div
            className="dropdown-menu"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="menu"
            tabIndex={0}
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              background: 'var(--creator-bg-elevated, #2a2a2a)',
              border: '1px solid var(--creator-border, #444)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 1000,
              minWidth: '180px',
              padding: '4px 0',
            }}
          >
            {actions.map(a => {
              if (a.divider) {
                return (
                  <div
                    key="divider"
                    style={{
                      height: '1px',
                      background: 'var(--creator-border, #444)',
                      margin: '4px 0',
                    }}
                  ></div>
                );
              }
              return (
                <button
                  key={a.key}
                  onClick={() => {
                    closeMenu();
                    a.onClick();
                  }}
                  disabled={a.disabled}
                  title={a.title}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: a.color,
                    textAlign: 'left',
                    cursor: a.disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (a.canHover) e.currentTarget.style.background = 'var(--creator-bg-hover, #383838)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className={a.icon} style={{ width: '16px' }}></i>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
