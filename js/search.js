// search.js - Funcionalidad de búsqueda independiente

class ProjectSearch {
    constructor() {
        this.searchInput = null;
        this.searchTimeout = null;
        this.debounceDelay = 100; // ms
        this.isInitialized = false;
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
    }

    // 🔍 MANEJAR BÚSQUEDA
    handleSearch(searchTerm) {
        // Limpiar timeout anterior
        clearTimeout(this.searchTimeout);

        // Mostrar/ocultar botón de limpiar
        this.toggleClearButton(searchTerm);

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

    // 🚀 EJECUTAR BÚSQUEDA
    async executeSearch(searchTerm) {
        console.log('🔍 Ejecutando búsqueda:', searchTerm);

        try {
            // Mostrar estado de carga
            this.showSearchLoading(true);

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

    // 🧹 LIMPIAR BÚSQUEDA
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
            this.executeSearch('');
        }
    }

    // 👁️ TOGGLE BOTÓN LIMPIAR
    toggleClearButton(searchTerm) {
        const clearButton = document.getElementById('search-clear');
        if (clearButton) {
            clearButton.style.display = searchTerm ? 'block' : 'none';
        }
    }

    // ⏳ MOSTRAR CARGA
    showSearchLoading(show) {
        // Puedes personalizar esto según tu UI
        const loadingElement = document.getElementById('search-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // ❌ MOSTRAR ERROR
    showSearchError(message) {
        console.error('❌ Error de búsqueda:', message);
        // Puedes implementar notificaciones toast aquí
        if (window.showError) {
            window.showError(message);
        }
    }

    // 🔧 CONFIGURAR RETRASO
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }

    // 📊 OBTENER ESTADÍSTICAS
    getSearchStats() {
        return {
            isInitialized: this.isInitialized,
            debounceDelay: this.debounceDelay,
            currentSearch: this.searchInput ? this.searchInput.value : ''
        };
    }
}

// 🎯 INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global
    window.projectSearch = new ProjectSearch();
    
    // Inicializar cuando la página esté lista
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.projectSearch.init();
        });
    } else {
        window.projectSearch.init();
    }
});

// 📡 EXPORTAR PARA MÓDULOS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectSearch;
}