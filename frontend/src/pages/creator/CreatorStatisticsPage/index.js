import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CreatorTopBar from '../../../creator/components/CreatorTopBar';
import CreatorTabs from '../../../creator/components/CreatorTabs';
import { StatisticsService } from '../../../creator/StatisticsService';
import '../../../creator/CreatorDashboard.css';
import './styles.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { handleLogout as logoutCsrf } from '../../../auth/logout';

export default function CreatorStatisticsPage() {
  const history = useHistory();
  const { modalState, closeModal, showError } = useModal();
  const [creatorPhoto, setCreatorPhoto] = useState('/pfp/avatar1.png');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para las estadísticas
  const [topByViews, setTopByViews] = useState([]);
  const [topByRatings, setTopByRatings] = useState([]);
  const [topByCategories, setTopByCategories] = useState([]);

  // Sesión basada en cookie
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/validate-token', { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error obteniendo sesión:', e);
      return null;
    }
  };

  useEffect(() => {
    loadCreatorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.creator-user-menu-container')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const loadCreatorProfile = async () => {
    try {
      const session = await fetchSession();
      const email = session?.email;
      if (!email) {
        console.error('Sesión inválida: no hay email');
        return;
      }

      const response = await fetch(`/api/creators/profile?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const profileData = await response.json();
        if (profileData.picture) {
          setCreatorPhoto(profileData.picture);
        } else {
          setCreatorPhoto('/pfp/avatar1.png');
        }
      } else {
        console.error('Error al obtener el perfil desde la BD:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar el perfil del creador desde la BD:', error);
    }
  };

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Cargar cada estadística individualmente para que si una falla, las demás sigan funcionando
      const [views, ratings, categories] = await Promise.allSettled([
        StatisticsService.getTopByViews(),
        StatisticsService.getTopByRatings(),
        StatisticsService.getTopByCategories()
      ]);
      
      // Establecer valores con fallback si alguna promesa falla
      setTopByViews(views.status === 'fulfilled' ? views.value : []);
      setTopByRatings(ratings.status === 'fulfilled' ? ratings.value : []);
      setTopByCategories(categories.status === 'fulfilled' ? categories.value : []);
      
      // Si todas fallaron, mostrar error
      if ([views, ratings, categories].every(result => result.status === 'rejected')) {
        showError('Error al cargar las estadísticas');
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      showError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => logoutCsrf('/login', history);

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      <div className="dashboard-box">
        <CreatorTopBar
          photoUrl={creatorPhoto}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(m => !m)}
          onLogout={handleLogout}
          onViewProfile={() => history.push('/creator/profile')}
          onEditProfile={() => history.push('/creator/profile/edit')}
        />

        <h2 className="section-title">Estadísticas</h2>
        
        <CreatorTabs />
        
        <p style={{ color: 'var(--creator-text-secondary)', marginBottom: '8px', fontSize: '15px' }}>
          Analiza el rendimiento de tus contenidos
        </p>

        {loading ? (
          <div className="statistics-loading">
            <p>Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="statistics-container">
            {/* Top 5 por reproducciones */}
              <div className="statistics-card">
              <h3 className="statistics-card-title">
                <i className="fas fa-play-circle"></i> Top 5 Reproducciones
              </h3>
              {topByViews.length === 0 ? (
                <p className="statistics-empty">No hay datos disponibles</p>
              ) : (
                <div className="statistics-list">
                  {topByViews.map((item, index) => (
                    <div key={item.id} className="statistics-item">
                      <div className="statistics-rank">#{index + 1}</div>
                      <div className="statistics-info">
                        <div className="statistics-title">{item.title}</div>
                        <div className="statistics-subtitle">{item.type}</div>
                      </div>
                      <div className="statistics-value">
                        {item.views?.toLocaleString() || 0} <span className="statistics-label">vistas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 por valoraciones */}
            <div className="statistics-card">
              <h3 className="statistics-card-title">
                <i className="fas fa-star"></i> Top 5 Valoraciones
              </h3>
              {topByRatings.length === 0 ? (
                <p className="statistics-empty">No hay datos disponibles</p>
              ) : (
                <div className="statistics-list">
                  {topByRatings.map((item, index) => (
                    <div key={item.id} className="statistics-item">
                      <div className="statistics-rank">#{index + 1}</div>
                      <div className="statistics-info">
                        <div className="statistics-title">{item.title}</div>
                        <div className="statistics-subtitle">{item.type}</div>
                      </div>
                      <div className="statistics-value">
                        <div className="statistics-rating">
                          {item.averageRating?.toFixed(1) || 0} <i className="fas fa-star" style={{ fontSize: '0.9em', color: '#ffc107' }}></i>
                        </div>
                        <div className="statistics-count">
                          {item.ratingCount || 0} {item.ratingCount === 1 ? 'valoración' : 'valoraciones'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 Categorías */}
            <div className="statistics-card statistics-card-wide">
              <h3 className="statistics-card-title">
                <i className="fas fa-chart-bar"></i> Top 5 Categorías Más Vistas
              </h3>
              {topByCategories.length === 0 ? (
                <p className="statistics-empty">No hay datos disponibles</p>
              ) : (
                <div className="statistics-list">
                  {topByCategories.map((item, index) => (
                    <div key={item.category} className="statistics-item">
                      <div className="statistics-rank">#{index + 1}</div>
                      <div className="statistics-info">
                        <div className="statistics-title">{item.category}</div>
                        <div className="statistics-subtitle">
                          {item.contentCount} {item.contentCount === 1 ? 'contenido' : 'contenidos'}
                        </div>
                      </div>
                      <div className="statistics-value">
                        {item.totalViews?.toLocaleString() || 0} <span className="statistics-label">vistas totales</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal personalizado */}
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
