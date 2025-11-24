// Ejemplos de uso del ContentLayout con diferentes configuraciones

import React from 'react';
import ContentLayout from './ContentLayout';
import poster from '../resources/poster.jpeg';
import postertiburon from '../resources/postertiburon.jpeg';

// ============================================
// EJEMPLO 1: Grid Básico de Contenidos
// ============================================
export function BasicContentGrid() {
  const contenidos = [
    { 
      id: 1, 
      titulo: 'Contenido Premium', 
      imagen: poster, 
      categoria: 'Serie',
      year: '2023',
      duration: '2h 15m',
      rating: '18+',
      ratingStars: 4.5,
      description: 'Una emocionante aventura...'
    },
    // ... más contenidos
  ];

  const handleClick = (content) => {
    console.log('Clicked:', content);
    // Navegar a detalle, reproducir, etc.
  };

  return (
    <ContentLayout
      title="Contenidos Recientes"
      content={contenidos}
      onContentClick={handleClick}
    />
  );
}

// ============================================
// EJEMPLO 2: Con Búsqueda
// ============================================
export function SearchableContent() {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const allContent = [
    { id: 1, titulo: 'Deep Blue', imagen: postertiburon, /* ... */ },
    { id: 2, titulo: 'Nano Tech', imagen: poster, /* ... */ },
  ];

  const filteredContent = allContent.filter(item =>
    item.titulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar..."
      />
      
      <ContentLayout
        title="Resultados de Búsqueda"
        content={filteredContent}
        onContentClick={(item) => console.log(item)}
        searchQuery={searchQuery}
      />
    </>
  );
}

// ============================================
// EJEMPLO 3: Múltiples Secciones
// ============================================
export function MultipleSections() {
  const sections = {
    trending: [/* contenidos trending */],
    series: [/* contenidos series */],
    movies: [/* contenidos películas */],
  };

  const handleContentClick = (content) => {
    // Lógica común para todos los clicks
    console.log('Selected:', content);
  };

  return (
    <div>
      <ContentLayout
        title="🔥 Tendencias"
        content={sections.trending}
        onContentClick={handleContentClick}
      />
      
      <ContentLayout
        title="📺 Series Populares"
        content={sections.series}
        onContentClick={handleContentClick}
      />
      
      <ContentLayout
        title="🎬 Películas Destacadas"
        content={sections.movies}
        onContentClick={handleContentClick}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 4: Con Carga desde API
// ============================================
export function APIContentGrid() {
  const [content, setContent] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/contenidos')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Cargando contenidos...</div>;
  }

  return (
    <ContentLayout
      title="Contenidos desde API"
      content={content}
      onContentClick={(item) => {
        // Navegar a página de detalle
        window.location.href = `/content/${item.id}`;
      }}
    />
  );
}

// ============================================
// EJEMPLO 5: Con Filtros Dinámicos
// ============================================
export function FilteredContentGrid() {
  const [category, setCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('recent');

  const allContent = [
    { id: 1, titulo: 'Content 1', categoria: 'Serie', year: '2023', /* ... */ },
    { id: 2, titulo: 'Content 2', categoria: 'Película', year: '2024', /* ... */ },
  ];

  const filteredContent = allContent
    .filter(item => category === 'all' || item.categoria === category)
    .sort((a, b) => {
      if (sortBy === 'recent') return b.year - a.year;
      if (sortBy === 'title') return a.titulo.localeCompare(b.titulo);
      return 0;
    });

  return (
    <div>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Todas las categorías</option>
          <option value="Serie">Series</option>
          <option value="Película">Películas</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Más recientes</option>
          <option value="title">Orden alfabético</option>
        </select>
      </div>

      <ContentLayout
        title={`${category === 'all' ? 'Todo el contenido' : category}`}
        content={filteredContent}
        onContentClick={(item) => console.log(item)}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 6: Mi Lista Personal
// ============================================
export function MyListContent() {
  const [myList, setMyList] = React.useState([]);

  const addToList = (item) => {
    setMyList(prev => [...prev, item]);
  };

  const removeFromList = (itemId) => {
    setMyList(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <ContentLayout
      title="Mi Lista Personal"
      content={myList}
      onContentClick={(item) => {
        // Mostrar detalle o reproducir
        console.log('Playing:', item);
      }}
    />
  );
}

// ============================================
// EJEMPLO 7: Contenido por Categoría con Tab
// ============================================
export function TabbedContent() {
  const [activeTab, setActiveTab] = React.useState('trending');

  const contentByCategory = {
    trending: [/* contenidos trending */],
    new: [/* contenidos nuevos */],
    popular: [/* contenidos populares */],
  };

  const tabs = [
    { id: 'trending', label: '🔥 Trending', icon: '🔥' },
    { id: 'new', label: '✨ Nuevos', icon: '✨' },
    { id: 'popular', label: '⭐ Populares', icon: '⭐' },
  ];

  return (
    <div>
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ContentLayout
        title={tabs.find(t => t.id === activeTab)?.label}
        content={contentByCategory[activeTab]}
        onContentClick={(item) => console.log(item)}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 8: Grid Infinito con Scroll
// ============================================
export function InfiniteScrollContent() {
  const [content, setContent] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadMore = React.useCallback(() => {
    fetch(`/api/contenidos?page=${page}`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setContent(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
        }
      });
  }, [page]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (hasMore) loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore]);

  return (
    <div>
      <ContentLayout
        title="Todos los Contenidos"
        content={content}
        onContentClick={(item) => console.log(item)}
      />
      {hasMore && <div>Cargando más...</div>}
    </div>
  );
}

export default {
  BasicContentGrid,
  SearchableContent,
  MultipleSections,
  APIContentGrid,
  FilteredContentGrid,
  MyListContent,
  TabbedContent,
  InfiniteScrollContent,
};
