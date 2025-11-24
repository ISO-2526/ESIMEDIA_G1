import poster from '../resources/poster.jpeg';
import postertiburon from '../resources/postertiburon.jpeg';
import posternano from '../resources/posternano.jpeg';
import posterhacker from '../resources/posterhacker.jpeg';
import posterinfantil from '../resources/posterinfantil.jpeg';

export const mockContents = [
  { 
    id: '1', 
    titulo: 'Contenido Premium', 
    imagen: poster, 
    categoria: 'Serie', 
    year: '2023', 
    duration: '2h 15m', 
    rating: '18+', 
    ratingStars: 4.5, 
    description: 'Una emocionante aventura que te mantendrá al borde de tu asiento.' 
  },
  { 
    id: '2', 
    titulo: 'Deep Blue', 
    imagen: postertiburon, 
    categoria: 'Película', 
    year: '2023', 
    duration: '1h 45m', 
    rating: '16+', 
    ratingStars: 4.7, 
    description: 'Un thriller oceánico lleno de suspenso y acción.' 
  },
  { 
    id: '3', 
    titulo: 'Nano', 
    imagen: posternano, 
    categoria: 'Documental', 
    year: '2023', 
    duration: '55m', 
    rating: '12+', 
    ratingStars: 4.3, 
    description: 'Explora el fascinante mundo de la nanotecnología.' 
  },
  { 
    id: '4', 
    titulo: 'Diagonallity', 
    imagen: posterhacker, 
    categoria: 'Serie', 
    year: '2023', 
    duration: '45m', 
    rating: '16+', 
    ratingStars: 4.6, 
    description: 'Un thriller tecnológico sobre ciberseguridad.' 
  },
  { 
    id: '5', 
    titulo: 'Robert', 
    imagen: posterinfantil, 
    categoria: 'Infantil', 
    year: '2023', 
    duration: '30m', 
    rating: 'TP', 
    ratingStars: 4.8, 
    description: 'Aventuras divertidas para toda la familia.' 
  },
];

export const getContentById = (id) => {
  return mockContents.find(content => content.id === id);
};

export const getContentsByIds = (ids) => {
  return ids.map(id => mockContents.find(content => content.id === id)).filter(c => c !== null && c !== undefined);
};
