import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles.css';

// Authentication Pages
import LoginPage from './pages/auth/LoginPage';
import RegistroPage from './pages/auth/RegistroPage';
import RecoverPassword from './pages/auth/RecoverPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Setup2FA from './pages/auth/Setup2FA';
import Validate2FA from './pages/auth/Validate2FA';
import Validate3FA from './pages/auth/Validate3FA';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserProfilePage from './pages/user/UserProfilePage';
import SubscriptionPage from './pages/user/SubscriptionPage';
import PlaylistsPage from './pages/user/PlaylistsPage';
import PlaylistDetailPage from './pages/user/PlaylistDetailPage';
import CreatorPlaylistViewPage from './pages/user/CreatorPlaylistViewPage';

// Creator Pages
import ContentCreatorDashboard from './pages/creator/ContentCreatorDashboard';
import CreatorPlaylistsPage from './pages/creator/CreatorPlaylistsPage';
import CreatorPlaylistDetailPage from './pages/creator/CreatorPlaylistDetailPage';
import CreatorStatisticsPage from './pages/creator/CreatorStatisticsPage';
import ProfilePage from './creator/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';
import DarAltaCuenta from './pages/admin/DarAltaCuenta';

// General Pages
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';

// Guards
import ProtectedRoute from './guards/ProtectedRoute';
import ProtectedRouteAfterLogin from './guards/ProtectedRouteAfterLogin';



function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={
          <ProtectedRouteAfterLogin>
            <HomePage />
          </ProtectedRouteAfterLogin>
        } />
        <Route path="/login" element={
          <ProtectedRouteAfterLogin>
            <LoginPage />
          </ProtectedRouteAfterLogin>
        } />
        <Route path="/registro" element={
          <ProtectedRouteAfterLogin>
            <RegistroPage />
          </ProtectedRouteAfterLogin>
        } />
        <Route path="/recuperar" element={<RecoverPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/setup-2fa" element={
          <ProtectedRouteAfterLogin>
            <Setup2FA />
          </ProtectedRouteAfterLogin>
        } />
        <Route path="/validate-2fa" element={
          <ProtectedRouteAfterLogin>
            <Validate2FA />
          </ProtectedRouteAfterLogin>
        } />
        <Route path="/validate-3fa" element={
          <ProtectedRouteAfterLogin>
            <Validate3FA />
          </ProtectedRouteAfterLogin>
        } />

        {/* Rutas de Usuario */}
        <Route path="/usuario" element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/suscripcion" element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        } />
        <Route path="/playlists" element={
          <ProtectedRoute>
            <PlaylistsPage />
          </ProtectedRoute>
        } />
        <Route path="/playlists/:id" element={
          <ProtectedRoute>
            <PlaylistDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/creator-playlists/:id" element={
          <ProtectedRoute>
            <CreatorPlaylistViewPage />
          </ProtectedRoute>
        } />

        {/* Rutas de Creador de Contenido */}
        <Route path="/creator" element={
          <ProtectedRoute allowedRoles={['creator']}>
            <ContentCreatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/creator/profile" element={<ProfilePage />} />
        <Route path="/creator/playlists" element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorPlaylistsPage />
          </ProtectedRoute>
        } />
        <Route path="/creator/playlists/:id" element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorPlaylistDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/creator/statistics" element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorStatisticsPage />
          </ProtectedRoute>
        } />

        {/* Rutas de Administrador */}
        <Route path="/adminDashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/adminDashboard/editProfile" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProfile />
          </ProtectedRoute>
        } />
        <Route path="/darAlta" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DarAltaCuenta />
          </ProtectedRoute>
        } />

        {/* Rutas de Error */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;