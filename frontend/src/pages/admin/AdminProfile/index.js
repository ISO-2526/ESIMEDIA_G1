import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminProfile.css';

function AdminProfile() {
    const location = useLocation();
    const navigate = useNavigate();
    const emailFromState = location.state?.email;

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: '',
        surname: '',
        email: '',
        department: 'CUSTOMER_SUPPORT',
        picture: '/pfp/avatar1.png',
        password: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (admin) {
            setForm({
                name: admin.name || '',
                surname: admin.surname || '',
                email: admin.email || '',
                department: admin.department || 'CUSTOMER_SUPPORT',
                picture: admin.picture || '/pfp/avatar1.png',
                password: ''
            });
        }
    }, [admin]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEdit = () => setEditing(true);

    const handleCancel = () => {
        if (admin) {
            setForm({
                name: admin.name || '',
                surname: admin.surname || '',
                email: admin.email || '',
                department: admin.department || 'CUSTOMER_SUPPORT',
                picture: admin.picture || '/pfp/avatar1.png',
                password: ''
            });
        }
        setEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const headers = { 'Content-Type': 'application/json' };
            const body = { name: form.name, surname: form.surname, department: form.department, picture: form.picture };
            if (form.password && form.password.trim() !== '') body.password = form.password;

            const putRes = await fetch(`/api/admins/${encodeURIComponent(form.email.trim())}`, {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (putRes.status === 401) { navigate('/login'); return; }
            if (putRes.ok) {
                const updated = await putRes.json();
                setAdmin(updated);
                setEditing(false);
                return;
            }
            if (putRes.status === 404 || putRes.status === 405) {
                setAdmin(prev => ({ ...prev, name: form.name, surname: form.surname, department: form.department, picture: form.picture, active: form.active }));
                setEditing(false);
                setError('Actualización guardada localmente (no existe endpoint de actualización).');
                return;
            }
            const text = await putRes.text();
            throw new Error(text || `Error: ${putRes.status}`);
        } catch (err) {
            setAdmin(prev => ({ ...prev, name: form.name, surname: form.surname, department: form.department, picture: form.picture, active: form.active }));
            setEditing(false);
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    // --- Refactor helpers (reducen complejidad de fetchAdmin) ---
    const buildHeaders = () => ({ 'Content-Type': 'application/json' });

    const handleUnauthorized = (res) => {
        if (res.status === 401) {
            navigate('/login');
            return true;
        }
        return false;
    };

    const loadAdminFromListByEmail = async (headers, targetEmail) => {
        const listRes = await fetch('/api/admins/admins', { headers, credentials: 'include' });
        if (handleUnauthorized(listRes)) return true;
        if (!listRes.ok) throw new Error('Error fetching admins');
        const list = await listRes.json();
        if (!Array.isArray(list) || list.length === 0) {
            setError('No hay administradores.');
            return true;
        }
        const match = list.find(a => a.email && a.email.toLowerCase() === targetEmail.toLowerCase());
        if (match) setAdmin(match);
        else setError('Admin no encontrado');
        return true;
    };

    const loadFirstAdminFromList = async (headers) => {
        const res = await fetch('/api/admins/admins', { headers, credentials: 'include' });
        if (handleUnauthorized(res)) return;
        if (!res.ok) throw new Error('Error fetching admins');
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) setAdmin(list[0]);
        else setError('No hay administradores.');
    };

    const fetchAdminByEmail = async (headers, email) => {
        const res = await fetch(`/api/admins/${encodeURIComponent(email)}`, { headers, credentials: 'include' });
        if (handleUnauthorized(res)) return;
        if (res.ok) {
            const data = await res.json();
            setAdmin(data);
            return;
        }
        if (res.status === 404) {
            await loadAdminFromListByEmail(headers, email);
            return;
        }
        throw new Error('Admin no encontrado');
    };
    // --- Fin helpers ---

    useEffect(() => {
        const fetchAdmin = async () => {
            setLoading(true);
            setError(null);
            try {
                const headers = buildHeaders();
                if (emailFromState) {
                    await fetchAdminByEmail(headers, emailFromState);
                } else {
                    await loadFirstAdminFromList(headers);
                }
            } catch (err) {
                setError(err.message || 'Error');
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, [emailFromState, navigate]);

    if (loading) return <div className="admin-profile-page"><div className="profile-container"><div style={{ color: '#F5F6F3', textAlign: 'center' }}>Cargando perfil...</div></div></div>;
    if (!admin) return <div className="admin-profile-page"><div className="profile-container"><div style={{ color: '#F5F6F3', textAlign: 'center' }}>No hay perfil para mostrar.</div></div></div>;

    return (
        <div className="admin-profile-page">
            <div className="profile-container">
                <div className="profile-box">
                    <h1>Perfil del Administrador</h1>
                    {error && <div className="error-message">{error}</div>}
                    <div className="profile-content">
                        <div className="profile-photo-section">
                            <div className="photo-container">
                                <img
                                    src={form.picture || admin.picture || '/pfp/avatar1.png'}
                                    alt="profile"
                                    className="profile-photo"
                                    onError={(e) => { e.currentTarget.src = '/pfp/avatar1.png'; }}
                                />
                            </div>
                        </div>
                        <div className="profile-form">
                            <div className="form-row">
                                <label htmlFor="admin-profile-name">Nombre:</label>
                                <input id="admin-profile-name" name="name" value={form.name} onChange={handleChange} disabled={!editing} />
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-surname">Apellido:</label>
                                <input id="admin-profile-surname" name="surname" value={form.surname} onChange={handleChange} disabled={!editing} />
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-email">Email:</label>
                                <input id="admin-profile-email" name="email" value={form.email} disabled />
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-department">Departamento:</label>
                                <select id="admin-profile-department" name="department" value={form.department} onChange={handleChange} disabled={!editing}>
                                    <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
                                    <option value="DATA_ANALYTICS">DATA_ANALYTICS</option>
                                    <option value="MODERATION">MODERATION</option>
                                    <option value="HUMAN_RESOURCES">HUMAN_RESOURCES</option>
                                    <option value="LEGAL_TEAM">LEGAL_TEAM</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-picture">Imagen:</label>
                                <select id="admin-profile-picture" name="picture" value={form.picture} onChange={handleChange} disabled={!editing}>
                                    <option value="/pfp/avatar1.png">Avatar 1</option>
                                    <option value="/pfp/avatar2.png">Avatar 2</option>
                                    <option value="/pfp/avatar3.png">Avatar 3</option>
                                    <option value="/pfp/avatar4.png">Avatar 4</option>
                                    <option value="/pfp/avatar5.png">Avatar 5</option>
                                    <option value="/pfp/avatar6.png">Avatar 6</option>
                                    <option value="/pfp/avatar7.png">Avatar 7</option>
                                    <option value="/pfp/avatar8.png">Avatar 8</option>
                                    <option value="/pfp/avatar9.png">Avatar 9</option>
                                    <option value="/pfp/avatar10.png">Avatar 10</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-password">Contraseña (nueva):</label>
                                <input
                                    id="admin-profile-password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Dejar vacío para no cambiar"
                                />
                            </div>
                            <div className="form-row">
                                <label htmlFor="admin-profile-3fa">Autenticación de Tercer Factor (3FA)</label>
                                <div id="admin-profile-3fa" className="field-value">✓ Activado (siempre activo para administradores)</div>
                            </div>
                            <div className="profile-actions">
                                {editing ? (
                                    <>
                                        <button onClick={handleSave} disabled={saving} className="btn-save">
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        <button onClick={handleCancel} disabled={saving} className="btn-cancel">
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleEdit} className="btn-edit">Editar</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="back-button-container">
                        <button onClick={() => navigate('/adminDashboard')} className="btn-back">
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminProfile;

