export const TAGS = [
  'Música',
  'Podcast',
  'Documental',
  'Educación',
  'Tecnología',
  'Deportes',
  'Noticias',
  'Comedia',
  'Infantil',
  'Gaming',
];

export const RESOLUTIONS = ['720', '1080', '4K'];
export const TYPES = ['AUDIO', 'VIDEO'];


export const STATES = ['PUBLICO', 'PRIVADO'];

export const COVER_OPTIONS = [
  'cover1.png',
  'cover3.png', 
  'covermusic1.jpeg',
  'covermusic2.jpeg',
  'coverpodcast.jpeg',
  'covergameplay1.jpeg',
  'covergameplay2.jpeg',
  'coverdocumentary1.jpeg',
  'coverdocumentary2.jpeg',
  'coversports.jpeg'
  
];

export const coverToUrl = (name) => (name ? `/cover/${name}` : null);