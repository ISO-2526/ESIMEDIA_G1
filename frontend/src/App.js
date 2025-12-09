import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import BackButtonHandler from './components/BackButtonHandler';
import { MobilePage } from './components/MobilePage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

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

// Guards
import ProtectedRoute from './guards/ProtectedRoute';
import ProtectedRouteAfterLogin from './guards/ProtectedRouteAfterLogin';

function App() {
  const isMobile = Capacitor.isNativePlatform(); // Detecta si es app móvil
  console.log('Running in:', isMobile ? 'mobile app' : 'web app');
  console.log('App component rendered');

  if (isMobile) {
    // App móvil: Solo rutas de usuario - TODAS envueltas en MobilePage para IonPage/IonContent
    return (
      <IonApp>
        <IonReactRouter>
          <BackButtonHandler />
          <IonRouterOutlet>
            {/* Rutas públicas */}
            <Route exact path="/" render={() => (
              <MobilePage>
                <ProtectedRouteAfterLogin>
                  <HomePage />
                </ProtectedRouteAfterLogin>
              </MobilePage>
            )} />
            <Route path="/login" render={() => (
              <MobilePage>
                <ProtectedRouteAfterLogin>
                  <LoginPage />
                </ProtectedRouteAfterLogin>
              </MobilePage>
            )} />
            <Route path="/registro" render={() => (
              <MobilePage>
                <ProtectedRouteAfterLogin>
                  <RegistroPage />
                </ProtectedRouteAfterLogin>
              </MobilePage>
            )} />
            <Route path="/recuperar" render={() => (
              <MobilePage><RecoverPassword /></MobilePage>
            )} />
            <Route path="/reset-password" render={() => (
              <MobilePage><ResetPassword /></MobilePage>
            )} />
            <Route path="/setup-2fa" render={() => (
              <MobilePage>
                <ProtectedRouteAfterLogin>
                  <Setup2FA />
                </ProtectedRouteAfterLogin>
              </MobilePage>
            )} />
            <Route path="/validate-2fa" render={() => (
              <MobilePage><Validate2FA /></MobilePage>
            )} />
            <Route path="/validate-3fa" render={() => (
              <MobilePage><Validate3FA /></MobilePage>
            )} />

            {/* Rutas de Usuario */}
            <Route path="/usuario" render={() => (
              <MobilePage>
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              </MobilePage>
            )} />
            <Route path="/perfil" render={() => (
              <MobilePage>
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              </MobilePage>
            )} />
            <Route path="/suscripcion" render={() => (
              <MobilePage>
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              </MobilePage>
            )} />
            <Route exact path="/playlists" render={() => (
              <MobilePage>
                <ProtectedRoute>
                  <PlaylistsPage />
                </ProtectedRoute>
              </MobilePage>
            )} />
            <Route path="/playlists/:id" render={() => (
              <MobilePage>
                <ProtectedRoute>
                  <PlaylistDetailPage />
                </ProtectedRoute>
              </MobilePage>
            )} />
            <Route path="/creator-playlists/:id" render={() => (
              <MobilePage>
                <ProtectedRoute>
                  <CreatorPlaylistViewPage />
                </ProtectedRoute>
              </MobilePage>
            )} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  } else {
    // App web: Todas las rutas
    return (
      <Router>
        <Switch>
          {/* Rutas públicas */}
          <Route exact path="/" component={HomePage} />
          <Route path="/login" render={() => (
            <ProtectedRouteAfterLogin>
              <LoginPage />
            </ProtectedRouteAfterLogin>
          )} />
          <Route path="/registro" render={() => (
            <ProtectedRouteAfterLogin>
              <RegistroPage />
            </ProtectedRouteAfterLogin>
          )} />
          <Route path="/recuperar" component={RecoverPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/setup-2fa" render={() => (
            <ProtectedRouteAfterLogin>
              <Setup2FA />
            </ProtectedRouteAfterLogin>
          )} />
          <Route path="/validate-2fa" render={() => (
            <ProtectedRouteAfterLogin>
              <Validate2FA />
            </ProtectedRouteAfterLogin>
          )} />
          <Route path="/validate-3fa" render={() => (
            <ProtectedRouteAfterLogin>
              <Validate3FA />
            </ProtectedRouteAfterLogin>
          )} />

          {/* Rutas de Usuario */}
          <Route path="/usuario" render={() => (
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/perfil" render={() => (
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          )} />
          <Route path="/suscripcion" render={() => (
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          )} />
          <Route exact path="/playlists" render={() => (
            <ProtectedRoute>
              <PlaylistsPage />
            </ProtectedRoute>
          )} />
          <Route path="/playlists/:id" render={() => (
            <ProtectedRoute>
              <PlaylistDetailPage />
            </ProtectedRoute>
          )} />
          <Route path="/creator-playlists/:id" render={() => (
            <ProtectedRoute>
              <CreatorPlaylistViewPage />
            </ProtectedRoute>
          )} />

          {/* Rutas de Creador de Contenido */}
          <Route exact path="/creator" render={() => (
            <ProtectedRoute allowedRoles={['creator']}>
              <ContentCreatorDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/creator/profile" component={ProfilePage} />
          <Route exact path="/creator/playlists" render={() => (
            <ProtectedRoute allowedRoles={['creator']}>
              <CreatorPlaylistsPage />
            </ProtectedRoute>
          )} />
          <Route path="/creator/playlists/:id" render={() => (
            <ProtectedRoute allowedRoles={['creator']}>
              <CreatorPlaylistDetailPage />
            </ProtectedRoute>
          )} />
          <Route path="/creator/statistics" render={() => (
            <ProtectedRoute allowedRoles={['creator']}>
              <CreatorStatisticsPage />
            </ProtectedRoute>
          )} />

          {/* Rutas de Administrador */}
          <Route exact path="/adminDashboard" render={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/adminDashboard/editProfile" render={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          )} />
          <Route path="/darAlta" render={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <DarAltaCuenta />
            </ProtectedRoute>
          )} />
        </Switch>
      </Router>
    );
  }
}

export default App;