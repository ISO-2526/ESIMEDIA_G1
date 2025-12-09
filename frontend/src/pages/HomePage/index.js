import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import { IonContent, IonPage } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import logo from '../../resources/esimedialogo.png';
import poster from '../../resources/coversports.jpeg';
import postertiburon from '../../resources/postertiburon.jpeg';
import posternano from '../../resources/posternano.jpeg';
import posterhacker from '../../resources/posterhacker.jpeg';
import posterinfantil from '../../resources/posterinfantil.jpeg';
import VideoPlayer from '../../components/VideoPlayer';
import './HomePage.css';

function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const contenidos = [
    {
      id: 1,
      titulo: 'Deportes',
      imagen: poster,
      categoria: 'Serie',
      videoUrl: 'https://www.youtube.com/watch?v=Do_z07ptlro' // Video de ejemplo
    },
    {
      id: 2,
      titulo: 'Acción Extrema',
      imagen: postertiburon,
      categoria: 'Película',
      videoUrl: 'https://www.youtube.com/watch?v=udm5jUA-2bs' // Video de ejemplo
    },
    {
      id: 3,
      titulo: 'Carreras',
      imagen: posternano,
      categoria: 'Carreras',
      videoUrl: 'https://www.youtube.com/watch?v=H4qYzIrxRds' // Video de ejemplo
    },
    {
      id: 4,
      titulo: 'Tecnología',
      imagen: posterhacker,
      categoria: 'Hacking',
      videoUrl: 'https://www.youtube.com/watch?v=N6HGuJC--rk' // Video de ejemplo
    },
    {
      id: 5,
      titulo: 'Infantil',
      imagen: posterinfantil,
      categoria: 'Infantil',
      videoUrl: 'https://www.youtube.com/watch?v=-49OU1O7lmo' // Video de ejemplo
    },
  ];

  const handleVideoClick = (contenido) => {
    setSelectedVideo(contenido);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const content = (
    <div className="homepage">
      {/* Animated Background */}
      <div className="animated-bg"></div>

      {/* Navbar simplificada para landing page */}
      <nav className={`navbar-premium ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-left">
            <img src={logo} className="logo-premium" alt="ESIMEDIA" />
          </div>

          <div className="nav-right">
            <div className="nav-slogan-landing">Tu contenido, tu creatividad</div>
          </div>
        </div>
      </nav>

      {/* Hero Section Mejorado */}
      <section className="hero-premium">
        <div className="hero-overlay"></div>

        <div className="hero-content-wrapper">
          {/* Carousel Premium */}
          <div className="carousel-premium">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              initialSlide={2}
              spaceBetween={15}
              loop={true}
              coverflowEffect={{
                rotate: 45,
                stretch: -35,
                depth: 120,
                modifier: 1,
                slideShadows: true,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              modules={[EffectCoverflow, Pagination, Autoplay]}
              className="swiper-premium"
            >
              {contenidos.map((contenido) => (
                <SwiperSlide key={contenido.id}>
                  <div
                    className="slide-content"
                    onClick={() => handleVideoClick(contenido)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVideoClick(contenido)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Reproducir ${contenido.titulo}`}
                  >
                    <img src={contenido.imagen} alt={contenido.titulo} />
                    <div className="slide-info">
                      <span className="slide-category">{contenido.categoria}</span>
                      <h3 className="slide-title">{contenido.titulo}</h3>
                    </div>
                    <div className="slide-play-overlay">
                      <i className="fas fa-play-circle"></i>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <div className="cta-glow"></div>
            <h1 className="hero-title-premium">
              Conecta. <span className="highlight">Crea.</span> Comparte.
            </h1>
            <p className="hero-subtitle-premium">
              Plataforma profesional de contenido multimedia para creadores
            </p>

            <div className="cta-question-premium">
              <i className="fas fa-rocket"></i>
              <span>¿Aún no tienes cuenta? ¿A qué estás esperando?</span>
            </div>

            <div className="cta-buttons-premium">
              <Link to="/registro" className="btn-premium btn-primary-premium">
                <span className="btn-shine"></span>
                <i className="fas fa-star"></i>{' '}
                Comenzar gratis
              </Link>
              <Link to="/login" className="btn-premium btn-secondary-premium">
                <i className="fas fa-sign-in-alt"></i>{' '}
                Iniciar sesión
              </Link>
            </div>

            <div className="features-badges">
              <div className="badge-item">
                <i className="fas fa-check-circle"></i>
                <span>Sin tarjeta</span>
              </div>
              <div className="badge-item">
                <i className="fas fa-infinity"></i>
                <span>Contenido ilimitado</span>
              </div>
              <div className="badge-item">
                <i className="fas fa-shield-alt"></i>
                <span>100% Seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </section>

      {/* Scroll to top button */}
      {scrolled && (
        <button
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo.videoUrl}
          title={selectedVideo.titulo}
          contentId={selectedVideo.id}
          onClose={handleCloseVideo}
        />
      )}
    </div>
  );

  if (Capacitor.isNativePlatform()) {
    return (
      <IonPage>
        <IonContent fullscreen>
          {content}
        </IonContent>
      </IonPage>
    );
  }

  return content;
}

export default HomePage;
