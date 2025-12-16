import React from 'react';
import PropTypes from 'prop-types';

const AccountEditForm = ({
  detail,
  editData,
  setEditData,
  onSubmit,
  onCancel
}) => {
  if (!detail) return null;
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-email">Email</label>
          <div id="admin-email" className="admin-form-input" style={{ background: '#f5f5f5', cursor: 'not-allowed' }}>{detail.data.email}</div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-type">Tipo</label>
          <div id="admin-type" className="admin-form-input" style={{ background: '#f5f5f5', cursor: 'not-allowed' }}>{detail.type}</div>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-name">Nombre</label>
          <input
            id="admin-name"
            className="admin-form-input"
            value={editData?.name || editData?.nombre || ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value, nombre: e.target.value }))}
          />
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-surname">Apellido</label>
          <input
            id="admin-surname"
            className="admin-form-input"
            value={editData?.surname || editData?.apellidos || ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, surname: e.target.value, apellidos: e.target.value }))}
          />
        </div>

        {detail.type === 'admin' && (
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="admin-department">Departamento</label>
            <select
              id="admin-department"
              className="admin-form-input"
              value={editData?.department || ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
              <option value="DATA_ANALYTICS">DATA_ANALYTICS</option>
              <option value="MODERATION">MODERATION</option>
              <option value="HUMAN_RESOURCES">HUMAN_RESOURCES</option>
              <option value="LEGAL_TEAM">LEGAL_TEAM</option>
            </select>
          </div>
        )}

        {detail.type === 'user' && (
          <div className="admin-form-group">
            <label className="admin-form-label">VIP: <strong>{detail.data.vip ? 'Sí' : 'No'}</strong> (no editable)</label>
          </div>
        )}

        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-picture">Picture URL</label>
          <input
            id="admin-picture"
            className="admin-form-input"
            value={editData?.picture || ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, picture: e.target.value }))}
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label" htmlFor="admin-active">Activa</label>
          <select
            id="admin-active"
            className="admin-form-input"
            value={(() => {
              if (typeof editData?.active === 'boolean') return String(editData.active);
              if (typeof editData?.isActive === 'boolean') return String(editData.isActive);
              return 'true';
            })()}
            onChange={(e) => setEditData((prev) => ({ ...prev, active: e.target.value === 'true' }))}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn-success">💾 Guardar</button>
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary">Cancelar</button>
      </div>
    </form>
  );
};

AccountEditForm.propTypes = {
  detail: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.shape({
      email: PropTypes.string.isRequired,
      vip: PropTypes.bool
    }).isRequired
  }).isRequired,
  editData: PropTypes.shape({
    name: PropTypes.string,
    nombre: PropTypes.string,
    surname: PropTypes.string,
    apellidos: PropTypes.string,
    department: PropTypes.string,
    picture: PropTypes.string,
    active: PropTypes.bool,
    isActive: PropTypes.bool
  }).isRequired,
  setEditData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default AccountEditForm;
