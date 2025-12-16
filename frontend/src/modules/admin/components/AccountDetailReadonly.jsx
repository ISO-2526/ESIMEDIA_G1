import React from 'react';
import PropTypes from 'prop-types';

const Field = ({ label, value }) => (
  <div className="admin-detail-field">
    <div className="admin-detail-field-label">{label}</div>
    <div className="admin-detail-field-value">{value ?? '—'}</div>
  </div>
);

const getAccountIsActive = (data) => (
  typeof data?.active === 'boolean'
    ? data.active
    : (typeof data?.isActive === 'boolean' ? data.isActive : true)
);

const getVipValue = (vip) => (typeof vip === 'boolean' ? (vip ? 'Sí' : 'No') : '—');

const EXTRA_FIELDS_MAP = {
  user: (data) => [
    <Field key="alias" label="Alias" value={data.alias || undefined} />,
    <Field key="vip" label="VIP" value={getVipValue(data.vip)} />
  ],
  admin: (data) => [
    <Field key="department" label="Departamento" value={data.department || undefined} />
  ],
  creator: (data) => [
    <Field key="alias" label="Alias" value={data.alias || undefined} />,
    <Field key="specialty" label="Especialidad" value={data.specialty || undefined} />,
    <Field key="ctype" label="Tipo de contenido" value={data.contentType || undefined} />
  ]
};

const buildExtraFields = (type, data) => {
  const builder = EXTRA_FIELDS_MAP[type];
  return builder ? builder(data) : [];
};

const AccountDetailReadonly = ({ detail }) => {
  if (!detail) return null;
  const type = detail.type;
  const data = detail.data || {};
  const isActive = getAccountIsActive(data);

  const name = data.name || data.nombre || '';
  const surname = data.surname || data.apellidos || '';
  const email = data.email || '';
  const picture = data.picture || '/pfp/avatar1.png';

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <img
          src={picture}
          alt="avatar"
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
          onError={(e) => { e.currentTarget.src = '/pfp/avatar1.png'; }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{name} {surname}</div>
          <div style={{ color: '#555' }}>{email}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`admin-status-badge ${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Activa' : 'Inactiva'}</span>
            <span style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
              background: '#eef2ff', color: '#3730a3', textTransform: 'capitalize'
            }}>{type}</span>
          </div>
        </div>
      </div>

      <div className="admin-detail-grid">
        <Field label="Nombre" value={name} />
        <Field label="Apellido" value={surname} />
        <Field label="Email" value={email} />
        {buildExtraFields(type, data)}
        <Field label="Activa" value={isActive ? 'Sí' : 'No'} />
        <Field label="Picture URL" value={picture} />
      </div>
    </div>
  );
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any
};

AccountDetailReadonly.propTypes = {
  detail: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.object
  })
};

export default AccountDetailReadonly;
