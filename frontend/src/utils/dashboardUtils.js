// ============================================
// SNIPPETS ÚTILES - User Dashboard ESIMEDIA
// ============================================

import { useState, useEffect } from 'react';
import React from 'react';
// Removed duplicate import of React

// ============================================
// 1. ESTRUCTURA DE DATOS DE CONTENIDO
// ============================================

const contenidoTemplate = {
    id: 1,
    titulo: 'Título del Contenido',
    imagen: './resources/imagen.jpeg',
    categoria: 'Serie', // 'Película', 'Documental', 'Infantil'
    year: '2023',
    duration: '2h 15m',
    rating: '18+', // 'TP', '12+', '16+', '18+'
    ratingStars: 4.5,
    description: 'Descripción completa del contenido...'
};

// ============================================
// 2. HOOK PERSONALIZADO PARA BÚSQUEDA
// ============================================

function useSearch(items, searchField = 'titulo') {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState(items);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item =>
                item[searchField].toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [searchQuery, items, searchField]);

    return [filteredItems, searchQuery, setSearchQuery];
}

// Uso:
// const [filteredContent, searchQuery, setSearchQuery] = useSearch(allContent, 'titulo');

// ============================================
// 3. HOOK PARA FILTRADO POR CATEGORÍA
// ============================================

function useCategory(items, initialCategory = 'todos') {
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [filteredItems, setFilteredItems] = useState(items);

    useEffect(() => {
        if (activeCategory === 'todos') {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item =>
                item.categoria.toLowerCase() === activeCategory.toLowerCase()
            );
            setFilteredItems(filtered);
        }
    }, [activeCategory, items]);

    return [filteredItems, activeCategory, setActiveCategory];
}

// ============================================
// 4. COMPONENTE DE LOADING
// ============================================

function LoadingSpinner() {
    return (
        <div className="loading-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            color: '#999AC6'
        }}>
            <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(79, 86, 186, 0.2)',
                borderTop: '4px solid #4F56BA',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
        </div>
    );
}

// CSS necesario:
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }

// ============================================
// 5. SERVICIO DE API (mock)
// ============================================

const ContentService = {
    // Obtener todos los contenidos
    async getAll() {
        const response = await fetch('/api/contenidos');
        return await response.json();
    },

    // Obtener por categoría
    async getByCategory(category) {
        const response = await fetch(`/api/contenidos?categoria=${category}`);
        return await response.json();
    },

    // Buscar contenidos
    async search(query) {
        const response = await fetch(`/api/contenidos/search?q=${query}`);
        return await response.json();
    },

    // Obtener contenido por ID
    async getById(id) {
        const response = await fetch(`/api/contenidos/${id}`);
        return await response.json();
    },

    // Añadir a Mi Lista
    async addToList(userId, contentId) {
        const response = await fetch('/api/mi-lista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, contentId })
        });
        return await response.json();
    },

    // Obtener Mi Lista
    async getMyList(userId) {
        const response = await fetch(`/api/mi-lista/${userId}`);
        return await response.json();
    }
};

// ============================================
// 6. COMPONENTE DE ERROR BOUNDARY
// (Removed as it is now moved to the top)


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error capturado:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '60px',
                    textAlign: 'center',
                    color: '#999AC6'
                }}>
                    <h2>¡Algo salió mal!</h2>
                    <p>Por favor, recarga la página.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

// Uso:
// <ErrorBoundary>
//   <UserDashboard />
// </ErrorBoundary>

// ============================================
// 7. HOOK PARA FAVORITOS/MI LISTA
// ============================================

function useMyList() {
    const [myList, setMyList] = useState([]);

    const addToList = (item) => {
        setMyList(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) return prev;
            return [...prev, item];
        });
    };

    const removeFromList = (itemId) => {
        setMyList(prev => prev.filter(item => item.id !== itemId));
    };

    const isInList = (itemId) => {
        return myList.some(item => item.id === itemId);
    };

    const toggleList = (item) => {
        if (isInList(item.id)) {
            removeFromList(item.id);
        } else {
            addToList(item);
        }
    };

    return { myList, addToList, removeFromList, isInList, toggleList };
}

// ============================================
// 8. UTILIDADES DE FORMATO
// ============================================

const formatUtils = {
    // Formatear duración
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    },

    // Formatear rating
    formatRating(rating) {
        return rating.toFixed(1);
    },

    // Truncar descripción
    truncateDescription(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // Formatear año
    formatYear(date) {
        return new Date(date).getFullYear();
    }
};

// ============================================
// 9. COMPONENTE DE SKELETON LOADER
// ============================================

function ContentCardSkeleton() {
    return (
        <div className="content-card-skeleton" style={{
            height: '320px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #1a1d1f 25%, #292B26 50%, #1a1d1f 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s ease-in-out infinite'
        }}>
        </div>
    );
}

// CSS necesario:
// @keyframes loading {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }

function ContentGridSkeleton({ count = 6 }) {
    return (
        <div className="content-grid-layout">
            {Array(count).fill(0).map((_, i) => (
                <ContentCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ============================================
// 10. HOOK DE INFINITE SCROLL
// ============================================

function useInfiniteScroll(callback, hasMore) {
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 500 && hasMore) {
                callback();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [callback, hasMore]);
}

// Uso:
// const [page, setPage] = useState(1);
// const [hasMore, setHasMore] = useState(true);
// 
// const loadMore = useCallback(() => {
//   // Cargar más contenido
//   setPage(p => p + 1);
// }, []);
// 
// useInfiniteScroll(loadMore, hasMore);

// ============================================
// 11. COMPONENTE DE TOAST/NOTIFICACIÓN
// ============================================

function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: '#4F56BA',
        error: '#ff4444',
        info: '#999AC6',
        warning: '#FAED5C'
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: colors[type],
            color: type === 'warning' ? '#292B26' : '#F5F6F3',
            padding: '15px 25px',
            borderRadius: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 9999,
            animation: 'slideInUp 0.3s ease'
        }}>
            {message}
        </div>
    );
}

// ============================================
// 12. VALIDACIONES
// ============================================

const validators = {
    // Validar contenido
    validateContent(content) {
        const required = ['id', 'titulo', 'imagen', 'categoria'];
        const missing = required.filter(field => !content[field]);

        if (missing.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
        }
        return true;
    },

    // Validar búsqueda
    validateSearch(query) {
        if (query.length < 2) {
            return { valid: false, message: 'Mínimo 2 caracteres' };
        }
        return { valid: true };
    }
};

// ============================================
// 13. LOCAL STORAGE HELPERS
// ============================================

const storage = {
    // Guardar Mi Lista
    saveMyList(userId, list) {
        localStorage.setItem(`myList_${userId}`, JSON.stringify(list));
    },

    // Obtener Mi Lista
    getMyList(userId) {
        const saved = localStorage.getItem(`myList_${userId}`);
        return saved ? JSON.parse(saved) : [];
    },

    // Guardar preferencias
    savePreferences(userId, prefs) {
        localStorage.setItem(`prefs_${userId}`, JSON.stringify(prefs));
    },

    // Obtener preferencias
    getPreferences(userId) {
        const saved = localStorage.getItem(`prefs_${userId}`);
        return saved ? JSON.parse(saved) : {};
    },

    // Guardar historial de búsqueda
    saveSearchHistory(userId, query) {
        const history = this.getSearchHistory(userId);
        const updated = [query, ...history.filter(q => q !== query)].slice(0, 10);
        localStorage.setItem(`searchHistory_${userId}`, JSON.stringify(updated));
    },

    // Obtener historial de búsqueda
    getSearchHistory(userId) {
        const saved = localStorage.getItem(`searchHistory_${userId}`);
        return saved ? JSON.parse(saved) : [];
    }
};

// ============================================
// 14. DEBOUNCE HOOK
// ============================================

function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Uso:
// const [searchTerm, setSearchTerm] = useState('');
// const debouncedSearchTerm = useDebounce(searchTerm, 500);
// 
// useEffect(() => {
//   if (debouncedSearchTerm) {
//     // Hacer búsqueda
//   }
// }, [debouncedSearchTerm]);

// ============================================
// 15. ANALYTICS TRACKING
// ============================================

const analytics = {
    // Trackear vista de contenido
    trackView(contentId, contentTitle) {
        console.log('View tracked:', contentId, contentTitle);
        // Enviar a analytics service
    },

    // Trackear búsqueda
    trackSearch(query, results) {
        console.log('Search tracked:', query, results.length);
    },

    // Trackear click
    trackClick(contentId, action) {
        console.log('Click tracked:', contentId, action);
    },

    // Trackear tiempo en página
    trackTimeOnPage(pageUrl, duration) {
        console.log('Time on page:', pageUrl, duration);
    }
};

// ============================================
// EXPORTS
// ============================================

export {
    useSearch,
    useCategory,
    LoadingSpinner,
    ContentService,
    ErrorBoundary,
    useMyList,
    formatUtils,
    ContentCardSkeleton,
    ContentGridSkeleton,
    useInfiniteScroll,
    Toast,
    validators,
    storage,
    useDebounce,
    analytics
};
