const ACCOUNT_ENDPOINTS = {
  user: {
    list: '/api/users',
    detail: (email) => `/api/users/${encodeURIComponent(email)}`,
    update: (email) => `/api/users/${encodeURIComponent(email)}`,
    active: (email) => `/api/users/${encodeURIComponent(email)}/active`,
    delete: null
  },
  admin: {
    list: '/api/admins/admins',
    detail: (email) => `/api/admins/${encodeURIComponent(email)}`,
    update: (email) => `/api/admins/${encodeURIComponent(email)}`,
    active: (email) => `/api/admins/${encodeURIComponent(email)}/active`,
    delete: (email) => `/api/admins/${encodeURIComponent(email)}`
  },
  creator: {
    list: '/api/admins/creators',
    detail: (email) => `/api/admins/creators/${encodeURIComponent(email)}`,
    update: null,
    active: (email) => `/api/admins/creators/${encodeURIComponent(email)}/active`,
    delete: (email) => `/api/admins/creators/${encodeURIComponent(email)}`
  }
};

const readBody = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options });
  const payload = await readBody(response);
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(message || `Error ${response.status}`);
  }
  return payload;
};

export const getCsrf = () => {
  return document.cookie.split('; ').find((s) => s.startsWith('csrf_token='))?.split('=')[1] || null;
};

const normalizeAccount = (item = {}, type) => ({
  type,
  name: item.name || item.nombre || '',
  surname: item.surname || item.apellidos || '',
  email: item.email || '',
  isActive: typeof item.active === 'boolean'
    ? item.active
    : (typeof item.isActive === 'boolean' ? item.isActive : true),
  picture: item.picture || ''
});

const fetchAccountsByType = async (type) => {
  const endpoint = ACCOUNT_ENDPOINTS[type]?.list;
  if (!endpoint) return [];
  const data = await fetchJson(endpoint).catch(() => []);
  return Array.isArray(data) ? data.map((item) => normalizeAccount(item, type)) : [];
};

export const fetchAllAccounts = async () => {
  const [users, admins, creators] = await Promise.all([
    fetchAccountsByType('user'),
    fetchAccountsByType('admin'),
    fetchAccountsByType('creator')
  ]);
  return [...users, ...admins, ...creators];
};

export const applySavedAccount = (saved, prevAccounts) => {
  if (!saved || !saved.email) return prevAccounts;
  return prevAccounts.map((account) => (
    account.email === saved.email
      ? {
          ...account,
          name: saved.nombre || saved.name || account.name,
          surname: saved.apellidos || saved.surname || account.surname,
          isActive: typeof saved.active === 'boolean'
            ? saved.active
            : (typeof saved.isActive === 'boolean' ? saved.isActive : account.isActive),
          picture: saved.picture || account.picture
        }
      : account
  ));
};

const getActiveStatus = (data = {}) => {
  if (typeof data.active === 'boolean') return data.active;
  if (typeof data.isActive === 'boolean') return data.isActive;
  return true;
};

const getNameField = (data = {}) => data.nombre || data.name || '';
const getSurnameField = (data = {}) => data.apellidos || data.surname || '';

const buildUserBody = (data = {}) => ({
  nombre: getNameField(data),
  apellidos: getSurnameField(data),
  alias: data.alias || '',
  picture: data.picture || '',
  active: getActiveStatus(data)
});

const buildAdminBody = (data = {}) => ({
  name: getNameField(data),
  surname: getSurnameField(data),
  department: data.department || '',
  picture: data.picture || '',
  active: getActiveStatus(data)
});

const requestWithCsrf = async (url, method, body) => {
  const headers = { 'Content-Type': 'application/json' };
  const csrf = getCsrf();
  if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  const options = { method, headers };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return fetchJson(url, options);
};

export const saveUser = async (detail, editData) => {
  if (!detail?.data?.email) throw new Error('No se puede guardar el usuario: email faltante');
  const url = ACCOUNT_ENDPOINTS.user.update(detail.data.email);
  const body = buildUserBody(editData);
  return requestWithCsrf(url, 'PUT', body);
};

export const saveAdmin = async (detail, editData) => {
  if (!detail?.data?.email) throw new Error('No se puede guardar el administrador: email faltante');
  const url = ACCOUNT_ENDPOINTS.admin.update(detail.data.email);
  const body = buildAdminBody(editData);
  return requestWithCsrf(url, 'PUT', body);
};

export const viewAccountDetail = async (account, showError, setDetail) => {
  if (!account?.type || !account.email) return;
  const endpoint = ACCOUNT_ENDPOINTS[account.type]?.detail;
  if (!endpoint) return;
  try {
    const data = await fetchJson(endpoint(account.email));
    if (data?.password) delete data.password;
    setDetail({ type: account.type, data });
  } catch (error) {
    console.error(error);
    showError?.(error?.message || 'Error al obtener los detalles');
  }
};

const ACTIVE_SUCCESS_MESSAGE = {
  user: { activated: 'Usuario activado correctamente', deactivated: 'Usuario bloqueado correctamente' },
  admin: { activated: 'Administrador activado correctamente', deactivated: 'Administrador bloqueado correctamente' },
  creator: { activated: 'Creador activado correctamente', deactivated: 'Creador bloqueado correctamente' }
};

export const toggleAccountActive = async (account, getTokenFn = getCsrf, showSuccess, showError) => {
  if (!account?.type || !account.email) return null;
  const endpointFactory = ACCOUNT_ENDPOINTS[account.type]?.active;
  if (!endpointFactory) {
    showError?.('No se puede cambiar el estado de esta cuenta');
    return null;
  }
  const headers = { 'Content-Type': 'application/json' };
  const csrf = getTokenFn?.();
  if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  try {
    const updated = await fetchJson(endpointFactory(account.email), {
      method: 'PUT',
      headers,
      body: JSON.stringify({ active: !account.isActive })
    });
    const messages = ACTIVE_SUCCESS_MESSAGE[account.type];
    if (messages) {
      showSuccess?.(!account.isActive ? messages.activated : messages.deactivated);
    }
    return updated;
  } catch (error) {
    console.error(error);
    showError?.(error?.message || 'No se pudo actualizar el estado');
    return null;
  }
};

const DELETE_MESSAGES = {
  admin: '¿Estás seguro de que deseas eliminar a este administrador? Esta acción no se puede deshacer.',
  creator: '¿Eliminar a este creador? Todo su acceso será revocado.'
};

export const requestDeleteAccount = (account, getTokenFn = getCsrf, showConfirm, showSuccess, showError) => {
  if (!account?.type || !account.email) return Promise.resolve(false);
  if (!['admin', 'creator'].includes(account.type)) {
    showError?.('Solo se pueden eliminar administradores o creadores');
    return Promise.resolve(false);
  }
  const endpointFactory = ACCOUNT_ENDPOINTS[account.type]?.delete;
  if (!endpointFactory) {
    showError?.('No existe endpoint de eliminación para este tipo');
    return Promise.resolve(false);
  }
  const message = DELETE_MESSAGES[account.type] || '¿Eliminar cuenta?';
  return new Promise((resolve) => {
    showConfirm?.(message, async () => {
      const headers = { 'Content-Type': 'application/json' };
      const csrf = getTokenFn?.();
      if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);
      try {
        await fetchJson(endpointFactory(account.email), { method: 'DELETE', headers });
        showSuccess?.('Cuenta eliminada correctamente');
        resolve(true);
      } catch (error) {
        console.error(error);
        showError?.(error?.message || 'Error al eliminar la cuenta');
        resolve(false);
      }
    }, 'Eliminar cuenta', 'Eliminar', 'Cancelar');
  });
};

export const filterAccounts = (accounts, search, filterType, currentEmail) => {
  const normalizedSearch = (search || '').toLowerCase();
  return accounts.filter((account) => {
    if (currentEmail && account.email?.toLowerCase() === currentEmail.toLowerCase()) return false;
    if (filterType !== 'all' && account.type !== filterType) return false;
    if (!normalizedSearch) return true;
    return (
      account.email?.toLowerCase().includes(normalizedSearch) ||
      account.name?.toLowerCase().includes(normalizedSearch) ||
      account.surname?.toLowerCase().includes(normalizedSearch)
    );
  });
};