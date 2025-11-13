// search.js - Funcionalidad de búsqueda independiente (ACTUALIZADO)

class ProjectSearch {
    constructor() {
        this.searchInput = null;
        this.searchTimeout = null;
        this.debounceDelay = 300; // ms - aumentado para mejor UX
        this.isInitialized = false;
        this.lastSearchTerm = '';
        this.isSearching = false;
    }

    // 🔧 INICIALIZAR BUSCADOR
    init() {
        if (this.isInitialized) return;

        this.searchInput = document.getElementById('search-input');
        
        if (!this.searchInput) {
            console.warn('⚠️ Elemento search-input no encontrado');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ Buscador inicializado');
    }

    // 🎯 CONFIGURAR EVENT LISTENERS
    setupEventListeners() {
        // Búsqueda en tiempo real con debounce
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value.trim());
        });

        // Limpiar búsqueda con Escape
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

        // Botón de limpiar (si existe)
        const clearButton = document.getElementById('search-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Manejar cuando el buscador pierde el foco
        this.searchInput.addEventListener('blur', () => {
            // Opcional: puedes agregar comportamiento aquí
        });

        // Manejar cuando el buscador obtiene el foco
        this.searchInput.addEventListener('focus', () => {
            // Opcional: puedes agregar comportamiento aquí
        });
    }

    // 🔍 MANEJAR BÚSQUEDA (ACTUALIZADO)
    handleSearch(searchTerm) {
        // Limpiar timeout anterior
        clearTimeout(this.searchTimeout);

        // Si el término no cambió, no hacer nada
        if (searchTerm === this.lastSearchTerm) {
            return;
        }
        
        this.lastSearchTerm = searchTerm;
        this.isSearching = !!searchTerm;

        // Mostrar/ocultar botón de limpiar
        this.toggleClearButton(searchTerm);

        // 🔥 NUEVO: Control inmediato del banner
        this.toggleBanner(searchTerm);

        // Si está vacío, cargar proyectos sin filtro
        if (!searchTerm) {
            this.executeSearch('');
            return;
        }

        // Debounce para evitar muchas consultas
        this.searchTimeout = setTimeout(() => {
            this.executeSearch(searchTerm);
        }, this.debounceDelay);
    }

    // 🔥 NUEVA FUNCIÓN: Controlar visibilidad del banner
    toggleBanner(searchTerm) {
        if (typeof window.toggleBannerVisibility === 'function') {
            // Ocultar banner si hay búsqueda, mostrar si no hay
            window.toggleBannerVisibility(!searchTerm);
        } else {
            // Fallback si la función no está disponible
            console.warn('⚠️ toggleBannerVisibility no disponible, usando fallback');
            const banner = document.getElementById('popular-banner');
            if (banner) {
                if (searchTerm) {
                    banner.classList.add('hidden');
                } else {
                    banner.classList.remove('hidden');
                }
            }
        }
    }

    // 🚀 EJECUTAR BÚSQUEDA (ACTUALIZADO)
    async executeSearch(searchTerm) {
        console.log('🔍 Ejecutando búsqueda:', searchTerm || '(vacío)');

        try {
            // Mostrar estado de carga
            this.showSearchLoading(true);

            // 🔥 NUEVO: Actualizar estado de búsqueda
            this.updateSearchState(searchTerm);

            // Usar la función existente loadPublicProjects
            if (typeof window.loadPublicProjects === 'function') {
                await window.loadPublicProjects(searchTerm);
            } else {
                console.error('❌ loadPublicProjects no está disponible');
                this.showSearchError('Funcionalidad de búsqueda no disponible');
            }

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            this.showSearchError('Error al buscar proyectos');
        } finally {
            this.showSearchLoading(false);
        }
    }

    // 🔥 NUEVA FUNCIÓN: Actualizar estado visual de la búsqueda
    updateSearchState(searchTerm) {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            if (searchTerm) {
                searchContainer.classList.add('searching');
            } else {
                searchContainer.classList.remove('searching');
            }
        }

        // Actualizar contador de resultados si existe
        this.updateResultsCounter(searchTerm);
    }

    // 🔥 NUEVA FUNCIÓN: Actualizar contador de resultados
    updateResultsCounter(searchTerm) {
        // Esta función puede ser extendida para mostrar número de resultados
        if (searchTerm) {
            console.log(`🔍 Buscando: "${searchTerm}"`);
        }
    }

    // 🧹 LIMPIAR BÚSQUEDA (ACTUALIZADO)
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
            this.lastSearchTerm = '';
            this.isSearching = false;
            
            // 🔥 NUEVO: Mostrar banner al limpiar
            this.toggleBanner('');
            
            this.executeSearch('');
            
            // 🔥 NUEVO: Disparar evento personalizado
            this.dispatchSearchClearedEvent();
        }
    }

    // 🔥 NUEVA FUNCIÓN: Disparar evento de búsqueda limpiada
    dispatchSearchClearedEvent() {
        const event = new CustomEvent('searchCleared', {
            bubbles: true,
            detail: { timestamp: Date.now() }
        });
        this.searchInput.dispatchEvent(event);
    }

    // 👁️ TOGGLE BOTÓN LIMPIAR
    toggleClearButton(searchTerm) {
        const clearButton = document.getElementById('search-clear');
        if (clearButton) {
            if (searchTerm) {
                clearButton.style.display = 'block';
                clearButton.setAttribute('aria-label', 'Limpiar búsqueda');
            } else {
                clearButton.style.display = 'none';
            }
        }
    }

    // ⏳ MOSTRAR CARGA (ACTUALIZADO)
    showSearchLoading(show) {
        // Puedes personalizar esto según tu UI
        const loadingElement = document.getElementById('search-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
            loadingElement.setAttribute('aria-hidden', !show);
        }

        // 🔥 NUEVO: También mostrar en el input
        if (this.searchInput) {
            if (show) {
                this.searchInput.setAttribute('data-loading', 'true');
            } else {
                this.searchInput.removeAttribute('data-loading');
            }
        }
    }

    // ❌ MOSTRAR ERROR (ACTUALIZADO)
    showSearchError(message) {
        console.error('❌ Error de búsqueda:', message);
        
        // Puedes implementar notificaciones toast aquí
        if (window.showError) {
            window.showError(message);
        }
        
        // 🔥 NUEVO: Disparar evento de error
        this.dispatchSearchErrorEvent(message);
    }

    // 🔥 NUEVA FUNCIÓN: Disparar evento de error
    dispatchSearchErrorEvent(message) {
        const event = new CustomEvent('searchError', {
            bubbles: true,
            detail: { 
                message: message,
                timestamp: Date.now(),
                searchTerm: this.lastSearchTerm
            }
        });
        this.searchInput.dispatchEvent(event);
    }

    // 🔧 CONFIGURAR RETRASO
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
        console.log(`⏱️ Debounce delay actualizado a: ${delay}ms`);
    }

    // 🔥 NUEVA FUNCIÓN: Obtener estado actual de búsqueda
    getSearchState() {
        return {
            isSearching: this.isSearching,
            currentTerm: this.lastSearchTerm,
            inputValue: this.searchInput ? this.searchInput.value : ''
        };
    }

    // 🔥 NUEVA FUNCIÓN: Realizar búsqueda programática
    search(term) {
        if (this.searchInput) {
            this.searchInput.value = term;
            this.handleSearch(term);
        }
    }

    // 📊 OBTENER ESTADÍSTICAS (ACTUALIZADO)
    getSearchStats() {
        return {
            isInitialized: this.isInitialized,
            isSearching: this.isSearching,
            debounceDelay: this.debounceDelay,
            currentSearch: this.lastSearchTerm,
            inputValue: this.searchInput ? this.searchInput.value : '',
            timestamp: Date.now()
        };
    }

    // 🔥 NUEVA FUNCIÓN: Destruir instancia (cleanup)
    destroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchInput = null;
        this.isInitialized = false;
        this.isSearching = false;
        this.lastSearchTerm = '';
        
        console.log('🧹 Buscador destruido');
    }
}

// 🎯 INICIALIZACIÓN AUTOMÁTICA (ACTUALIZADA)
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global
    window.projectSearch = new ProjectSearch();
    
    // Inicializar con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        window.projectSearch.init();
    }, 100);
});

// 🔥 NUEVO: Manejar navegación con el botón "Atrás" del navegador
window.addEventListener('popstate', (event) => {
    if (window.projectSearch && window.projectSearch.isInitialized) {
        // Si hay una búsqueda activa y el usuario navega hacia atrás,
        // podrías querer limpiar la búsqueda
        const searchState = window.projectSearch.getSearchState();
        if (searchState.isSearching) {
            // Opcional: limpiar búsqueda al navegar atrás
            // window.projectSearch.clearSearch();
        }
    }
});

// 🔥 NUEVO: Exportar funciones útiles para uso global
window.SearchUtils = {
    clearSearch: () => {
        if (window.projectSearch) {
            window.projectSearch.clearSearch();
        }
    },
    
    search: (term) => {
        if (window.projectSearch) {
            window.projectSearch.search(term);
        }
    },
    
    getSearchState: () => {
        if (window.projectSearch) {
            return window.projectSearch.getSearchState();
        }
        return null;
    },
    
    setDebounce: (delay) => {
        if (window.projectSearch) {
            window.projectSearch.setDebounceDelay(delay);
        }
    }
};

// 📡 EXPORTAR PARA MÓDULOS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectSearch;
}