import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './AdminDashboard.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { handleLogout as logoutCsrf } from '../../../auth/logout.js';
import AccountDetailReadonly from '../../../modules/admin/components/AccountDetailReadonly';
import AccountEditForm from '../../../modules/admin/components/AccountEditForm';
import { useAccountsPanel, useContentPanel, useCurrentEmail } from '../../../modules/admin/hooks/useAdminPanels';

function AdminDashboard() {
  const { modalState, closeModal, showSuccess, showError, showWarning, showConfirm } = useModal();
  const [tab, setTab] = useState('accounts');
  const history = useHistory();
  const currentEmail = useCurrentEmail();

  const accountsPanel = useAccountsPanel({
    enabled: tab === 'accounts',
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    currentEmail
  });

  const contentsPanel = useContentPanel({ enabled: tab === 'content' });

  const handleLogout = async () => { await logoutCsrf('/login', history); };

  const {
    accounts,
    loading: loadingAccounts,
    error: accountsError,
    detail: accountDetail,
    isEditing,
    editData,
    setEditData,
    search,
    filterType,
    filteredAccounts,
    setSearch,
    setFilterType,
    clearFilters,
    cancelEditing,
    handleAccountEditSubmit,
    handleToggleActive,
    handleDeleteAccount,
    handleViewAccount,
    handleStartEdit,
    handleCloseDetail
  } = accountsPanel;

  const {
    allContents,
    loadingContents,
    contentError,
    detail: contentDetail,
    handleViewContent,
    closeContentDetail
  } = contentsPanel;

  const adminProfile = accounts.find((a) => a.type === 'admin' && a.email);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-header-title">Panel de Administración</h1>
          <div className="admin-header-actions">
            <button onClick={async () => { try { await handleLogout(); } catch (e) { /* noop */ } }} className="admin-btn admin-btn-secondary">Cerrar sesión</button>
            <div 
              onClick={() => {
                const state = adminProfile?.email ? { state: { email: adminProfile.email } } : undefined;
                history.push('/adminDashboard/editProfile', state);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const state = adminProfile?.email ? { state: { email: adminProfile.email } } : undefined;
                  history.push('/adminDashboard/editProfile', state);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Editar perfil"
            >
              <img
                className="admin-profile-pic"
                src={adminProfile?.picture || '/pfp/avatar1.png'}
                alt="profile"
                onError={(e) => { e.currentTarget.src = '/pfp/avatar1.png'; }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-toolbar">
          <div className="admin-toolbar-row">
            <Link to="/darAlta">
              <button className="admin-btn admin-btn-primary">➕ Dar cuenta de alta</button>
            </Link>
          </div>
          <div className="admin-toolbar-row">
            <input
              className="admin-search"
              placeholder="🔍 Buscar por email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              <option value="user">Usuarios</option>
              <option value="admin">Administradores</option>
              <option value="creator">Creadores</option>
            </select>
            <button onClick={clearFilters} className="admin-btn admin-btn-secondary">Limpiar filtros</button>
          </div>
        </div>

        <div className="admin-tabs">
          <button onClick={() => setTab('accounts')} className={`admin-tab ${tab === 'accounts' ? 'active' : ''}`}>Cuentas</button>
          <button onClick={() => setTab('content')} className={`admin-tab ${tab === 'content' ? 'active' : ''}`}>Contenido</button>
        </div>

        {tab === 'accounts' ? (
          <div>
            {loadingAccounts && <div className="admin-loading">Cargando cuentas...</div>}
            {accountsError && <div className="admin-alert admin-alert-error">{accountsError}</div>}
            {!loadingAccounts && !accountsError && (
              <>
                {accountDetail && (
                  <div className="admin-detail-panel">
                    <div className="admin-detail-header">
                      <div>
                        <div className="admin-detail-title">{accountDetail.type?.toUpperCase() || 'Cuenta'}</div>
                        <div className="admin-detail-subtitle">{accountDetail.data?.email || ''}</div>
                      </div>
                      <div className="admin-detail-actions">
                        {!isEditing && (accountDetail.type === 'user' || accountDetail.type === 'admin') && (
                          <button onClick={handleStartEdit} className="admin-btn admin-btn-primary">✏️ Editar</button>
                        )}
                        <button onClick={handleCloseDetail} className="admin-btn admin-btn-secondary">✕ Cerrar</button>
                      </div>
                    </div>

                    {!isEditing
                      ? <AccountDetailReadonly detail={accountDetail} />
                      : (
                        <AccountEditForm
                          detail={accountDetail}
                          editData={editData}
                          setEditData={setEditData}
                          onSubmit={handleAccountEditSubmit}
                          onCancel={cancelEditing}
                        />
                      )}
                  </div>
                )}

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'center' }}>Bloquear/Activar</th>
                        <th style={{ textAlign: 'center' }}>Eliminar</th>
                        <th style={{ textAlign: 'center' }}>Ver Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr key={account.email}>
                          <td><span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{account.type}</span></td>
                          <td>{account.name}</td>
                          <td>{account.surname}</td>
                          <td>{account.email}</td>
                          <td>
                            <span className={`admin-status-badge ${account.isActive ? 'active' : 'inactive'}`}>
                              {account.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="admin-btn admin-btn-secondary admin-action-btn"
                              onClick={() => handleToggleActive(account)}
                            >
                              {account.isActive ? '🔒 Bloquear' : '✓ Activar'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {(account.type === 'admin' || account.type === 'creator') ? (
                              <button
                                className="admin-btn admin-btn-danger admin-action-btn"
                                onClick={() => handleDeleteAccount(account)}
                              >
                                🗑️ Eliminar
                              </button>
                            ) : (
                              <button
                                className="admin-btn admin-btn-disabled admin-action-btn"
                                disabled
                                title="No se puede eliminar usuarios regulares"
                              >
                                🗑️ Eliminar
                              </button>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="admin-btn admin-btn-ghost admin-action-btn"
                              onClick={() => handleViewAccount(account)}
                            >
                              👁️ Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredAccounts.length === 0 && (
                        <tr>
                          <td colSpan={8} className="admin-empty-state">
                            <div className="admin-empty-state-icon">📭</div>
                            <div>No se encontraron cuentas que coincidan con los filtros.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="admin-content-header" style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Gestión de Contenido</h2>
              <p style={{ color: '#666', marginTop: '8px' }}>
                Visualiza y gestiona todo el contenido de la plataforma
              </p>
            </div>

            {loadingContents && <div className="admin-loading">Cargando contenidos...</div>}
            {contentError && <div className="admin-alert admin-alert-error">{contentError}</div>}

            {!loadingContents && !contentError && (
              <>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#333' }}>
                  <strong>Total de contenidos:</strong> {allContents.length} {' | '}
                  <strong>Públicos:</strong> {allContents.filter((c) => c.state === 'PUBLICO').length} {' | '}
                  <strong>Privados:</strong> {allContents.filter((c) => c.state === 'PRIVADO').length}
                </div>

                <div style={{ marginTop: 18, overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Portada</th>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th className="hide-sm">Creador</th>
                        <th className="hide-sm">Fecha estado</th>
                        <th className="hide-xs">Tags</th>
                        <th className="actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!allContents || allContents.length === 0) && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                            No hay contenidos disponibles.
                          </td>
                        </tr>
                      )}
                      {allContents?.map((content) => (
                        <tr key={content.id}>
                          <td>
                            {(() => {
                              const coverSrc = content.coverUrl || (content.coverFileName ? `/cover/${content.coverFileName}` : null);
                              return coverSrc ? (
                                <img
                                  src={coverSrc}
                                  alt="Portada"
                                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                  onError={(e) => { e.currentTarget.src = '/default-cover.png'; }}
                                />
                              ) : (
                                <div style={{ width: 60, height: 60, background: '#ddd', borderRadius: 4 }}></div>
                              );
                            })()}
                          </td>
                          <td style={{ fontWeight: 500 }}>{content.title}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: content.type === 'AUDIO' ? '#e3f2fd' : '#f3e5f5',
                              color: content.type === 'AUDIO' ? '#1976d2' : '#7b1fa2'
                            }}>{content.type}</span>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: content.state === 'PUBLICO' ? '#e8f5e9' : '#fff3e0',
                              color: content.state === 'PUBLICO' ? '#2e7d32' : '#e65100'
                            }}>{content.state}</span>
                          </td>
                          <td className="hide-sm">{content.creatorAlias || content.creatorEmail || 'N/A'}</td>
                          <td className="hide-sm">{content.stateChangedAt ? new Date(content.stateChangedAt).toLocaleString() : '—'}</td>
                          <td className="hide-xs">{(content.tags || []).join(', ') || '—'}</td>
                          <td className="actions">
                            <button onClick={() => handleViewContent(content.id)} className="btn btn-ghost" style={{ fontSize: '14px' }}>
                              👁️ Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {contentDetail && (
              <div className="admin-detail-panel">
                <div className="admin-detail-header">
                  <div>
                    <div className="admin-detail-title">Detalles del Contenido</div>
                    <div className="admin-detail-subtitle">{contentDetail.data?.title || ''}</div>
                  </div>
                  <button onClick={closeContentDetail} className="admin-btn admin-btn-secondary">Cerrar</button>
                </div>
                <div className="admin-detail-content">
                  <div><strong>ID:</strong> {contentDetail.data?.id}</div>
                  <div><strong>Título:</strong> {contentDetail.data?.title}</div>
                  <div><strong>Tipo:</strong> {contentDetail.data?.type}</div>
                  <div><strong>Estado:</strong> {contentDetail.data?.state}</div>
                  <div><strong>Creador:</strong> {contentDetail.data?.creatorAlias || 'N/A'}</div>
                  <div><strong>Descripción:</strong> {contentDetail.data?.description || 'Sin descripción'}</div>
                  <div><strong>Tags:</strong> {(contentDetail.data?.tags || []).join(', ') || 'Sin tags'}</div>
                  {contentDetail.data?.coverUrl && (
                    <div>
                      <strong>Portada:</strong><br />
                      <img
                        src={contentDetail.data.coverUrl}
                        alt="Portada"
                        style={{ maxWidth: '300px', marginTop: '8px', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}

export default AdminDashboard;
