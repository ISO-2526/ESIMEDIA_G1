import React, { useState } from 'react';
import StarRating from './StarRating';
import './StarRating.css';

/**
 * DEMO DEL SISTEMA DE VALORACIÓN CON ESTRELLAS
 * 
 * Este componente es solo para demostración y testing.
 * Muestra cómo funciona el componente StarRating con diferentes configuraciones.
 */
function StarRatingDemo() {
  const [video1Rating, setVideo1Rating] = useState(0);
  const [video2Rating, setVideo2Rating] = useState(0);
  const [audio1Rating, setAudio1Rating] = useState(0);

  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#4F56BA' }}>
        🌟 Sistema de Valoración con Estrellas - DEMO
      </h1>

      {/* Explicación */}
      <div style={{
        background: 'rgba(79, 86, 186, 0.2)',
        border: '2px solid rgba(79, 86, 186, 0.4)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px'
      }}>
        <h2>📖 Cómo usar:</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>🖱️ <strong>Click en la mitad izquierda</strong> de una estrella → Media estrella (0.5, 1.5, 2.5...)</li>
          <li>🖱️ <strong>Click en la mitad derecha</strong> de una estrella → Estrella completa (1.0, 2.0, 3.0...)</li>
          <li>👁️ <strong>Pasa el ratón</strong> sobre las estrellas para ver preview</li>
          <li>💾 Las valoraciones se <strong>guardan automáticamente</strong> en localStorage</li>
          <li>🔄 Puedes <strong>cambiar tu valoración</strong> en cualquier momento</li>
          <li>🔍 Recarga la página y tu valoración <strong>persistirá</strong></li>
        </ul>
      </div>

      {/* Ejemplos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginTop: '30px'
      }}>
        {/* Video 1 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '25px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#FFD700' }}>🎬 Video 1</h3>
          <p style={{ opacity: 0.8 }}>Tu valoración actual: <strong>{video1Rating.toFixed(1)}</strong> estrellas</p>
          <StarRating 
            contentId={1}
            contentType="video"
            onChange={setVideo1Rating}
          />
          <div style={{ 
            marginTop: '15px', 
            fontSize: '12px', 
            opacity: 0.6,
            fontFamily: 'monospace'
          }}>
            Key: rating_video_1
          </div>
        </div>

        {/* Video 2 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '25px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#FFD700' }}>🎬 Video 2</h3>
          <p style={{ opacity: 0.8 }}>Tu valoración actual: <strong>{video2Rating.toFixed(1)}</strong> estrellas</p>
          <StarRating 
            contentId={2}
            contentType="video"
            onChange={setVideo2Rating}
          />
          <div style={{ 
            marginTop: '15px', 
            fontSize: '12px', 
            opacity: 0.6,
            fontFamily: 'monospace'
          }}>
            Key: rating_video_2
          </div>
        </div>

        {/* Audio 1 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '25px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#E01A4F' }}>🎵 Audio 1</h3>
          <p style={{ opacity: 0.8 }}>Tu valoración actual: <strong>{audio1Rating.toFixed(1)}</strong> estrellas</p>
          <StarRating 
            contentId={1}
            contentType="audio"
            onChange={setAudio1Rating}
          />
          <div style={{ 
            marginTop: '15px', 
            fontSize: '12px', 
            opacity: 0.6,
            fontFamily: 'monospace'
          }}>
            Key: rating_audio_1
          </div>
        </div>
      </div>

      {/* Inspeccionar localStorage */}
      <div style={{
        marginTop: '40px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2>🔍 Inspeccionar LocalStorage</h2>
        <p style={{ opacity: 0.8 }}>
          Abre la consola del navegador (F12) y ejecuta:
        </p>
        <pre style={{
          background: '#000',
          padding: '15px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`// Ver todas las valoraciones guardadas
Object.keys(localStorage)
  .filter(key => key.startsWith('rating_'))
  .forEach(key => {
    console.log(key, '→', localStorage.getItem(key));
  });

// Limpiar todas las valoraciones
Object.keys(localStorage)
  .filter(key => key.startsWith('rating_'))
  .forEach(key => localStorage.removeItem(key));
`}
        </pre>
      </div>

      {/* Características técnicas */}
      <div style={{
        marginTop: '40px',
        background: 'rgba(79, 86, 186, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(79, 86, 186, 0.3)'
      }}>
        <h2>⚙️ Características Técnicas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#4F56BA' }}>Frontend</h3>
            <ul>
              <li>✅ React Component</li>
              <li>✅ LocalStorage Persistence</li>
              <li>✅ Click Precision Detection</li>
              <li>✅ Hover Preview</li>
              <li>✅ Responsive Design</li>
              <li>✅ Smooth Animations</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#4F56BA' }}>Funcionalidad</h3>
            <ul>
              <li>✅ Estrellas completas (1-5)</li>
              <li>✅ Medias estrellas (0.5-4.5)</li>
              <li>✅ Modificación de valoraciones</li>
              <li>✅ Persistencia entre sesiones</li>
              <li>✅ Por contenido individual</li>
              <li>✅ Callback onChange</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Próximos pasos */}
      <div style={{
        marginTop: '40px',
        background: 'rgba(224, 26, 79, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(224, 26, 79, 0.3)'
      }}>
        <h2>🚀 Próximos Pasos</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>🔧 <strong>Backend Integration</strong>: Conectar con API para guardar valoraciones en BD</li>
          <li>📊 <strong>Agregación</strong>: Calcular promedio de valoraciones de todos los usuarios</li>
          <li>👥 <strong>Estadísticas</strong>: Mostrar número total de valoraciones</li>
          <li>🎯 <strong>Filtros</strong>: Ordenar/filtrar contenido por valoración</li>
          <li>📈 <strong>Trending</strong>: Contenido más valorado</li>
          <li>💬 <strong>Reviews</strong>: Añadir comentarios a las valoraciones</li>
        </ol>
      </div>
    </div>
  );
}

export default StarRatingDemo;
