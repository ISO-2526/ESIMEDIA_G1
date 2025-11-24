import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentService } from '../../../creator/ContentService';
import {
  getCsrf,
  applySavedAccount,
  saveUser,
  saveAdmin,
  viewAccountDetail,
  fetchAllAccounts,
  toggleAccountActive as toggleAccountActiveUtil,
  requestDeleteAccount as requestDeleteAccountUtil,
  filterAccounts
} from '../utils/adminUtils';

export const useCurrentEmail = () => {
  const [currentEmail, setCurrentEmail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/validate-token', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const email = data?.email || data?.data?.email || null;
        if (!cancelled) setCurrentEmail(email);
      } catch (_) {
        if (!cancelled) setCurrentEmail(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return currentEmail;
};

export const useAccountsPanel = ({
  enabled,
  showSuccess,
  showError,
  showWarning,
  showConfirm,
  currentEmail
}) => {
  const [accounts, setAccounts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const accountsList = await fetchAllAccounts();
        if (alive) setAccounts(accountsList);
      } catch (err) {
        if (alive) setError(err?.message || 'Error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [enabled]);

  const refreshAccounts = useCallback(async () => {
    const accountsList = await fetchAllAccounts();
    setAccounts(accountsList);
  }, []);

  const actionMap = useMemo(() => ({
    user: async (currentDetail, currentEditData) => {
      const saved = await saveUser(currentDetail, currentEditData);
      setAccounts((prev) => applySavedAccount(saved, prev));
      setDetail({ type: currentDetail.type, data: saved });
      showSuccess('Usuario guardado correctamente');
    },
    admin: async (currentDetail, currentEditData) => {
      const saved = await saveAdmin(currentDetail, currentEditData);
      setAccounts((prev) => applySavedAccount(saved, prev));
      setDetail({ type: currentDetail.type, data: saved });
      showSuccess('Administrador guardado correctamente');
    }
  }), [showSuccess]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditData(null);
  }, []);

  const handleAccountEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!detail) return;
    try {
      const fn = actionMap[detail.type];
      if (!fn) {
        showWarning('Edición no soportada para este tipo');
        return;
      }

      await fn(detail, editData);
      cancelEditing();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Error al guardar los cambios');
    }
  }, [detail, editData, actionMap, showWarning, showError, cancelEditing]);

  const handleToggleActive = useCallback(async (account) => {
    const updated = await toggleAccountActiveUtil(account, getCsrf, showSuccess, showError);
    if (updated) {
      setAccounts((prev) => prev.map((a) => (
        a.email === account.email
          ? { ...a, isActive: typeof updated.active === 'boolean' ? updated.active : updated.isActive }
          : a
      )));
      setDetail((prev) => {
        if (!prev || prev.data?.email !== account.email) return prev;
        return { ...prev, data: { ...prev.data, ...updated } };
      });
    }
  }, [showSuccess, showError]);

  const handleDeleteAccount = useCallback(async (account) => {
    const deleted = await requestDeleteAccountUtil(account, getCsrf, showConfirm, showSuccess, showError);
    if (deleted) {
      try {
        await refreshAccounts();
        setDetail((prev) => (prev?.data?.email === account.email ? null : prev));
      } catch (err) {
        console.error('Error refetching accounts:', err);
      }
    }
  }, [refreshAccounts, showConfirm, showSuccess, showError]);

  const handleViewAccount = useCallback((account) => {
    viewAccountDetail(account, showError, setDetail);
    cancelEditing();
  }, [showError, cancelEditing]);

  const handleStartEdit = useCallback(() => {
    if (!detail) return;
    const copy = JSON.parse(JSON.stringify(detail.data));
    if (copy?.password) delete copy.password;
    setIsEditing(true);
    setEditData(copy);
  }, [detail]);

  const handleCloseDetail = useCallback(() => {
    setDetail(null);
    cancelEditing();
  }, [cancelEditing]);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, search, filterType, currentEmail),
    [accounts, search, filterType, currentEmail]
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterType('all');
  }, []);

  return {
    accounts,
    loading,
    error,
    detail,
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
  };
};

export const useContentPanel = ({ enabled }) => {
  const [allContents, setAllContents] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [contentError, setContentError] = useState(null);

  const fetchAllContents = useCallback(async () => {
    setLoadingContents(true);
    setContentError(null);
    try {
      const data = await ContentService.getAll();
      setAllContents(data || []);
    } catch (err) {
      setContentError(err?.message || 'Error al cargar los contenidos');
    } finally {
      setLoadingContents(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchAllContents();
  }, [enabled, fetchAllContents]);

  const handleViewContent = useCallback((id) => {
    const content = allContents.find((c) => c.id === id);
    if (content) setDetail({ type: 'content', data: content });
  }, [allContents]);

  const closeContentDetail = useCallback(() => setDetail(null), []);

  return {
    allContents,
    loadingContents,
    contentError,
    detail,
    handleViewContent,
    closeContentDetail
  };
};
