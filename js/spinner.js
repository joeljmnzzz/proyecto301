// spinner.js - Spinner Universal con traducciones
class UniversalSpinner {
    constructor() {
        this.spinner = null;
        this.init();
    }

    init() {
        // Crear el spinner si no existe
        if (!document.getElementById('universal-spinner')) {
            this.spinner = document.createElement('div');
            this.spinner.id = 'universal-spinner';
            this.spinner.className = 'universal-spinner';
            this.spinner.innerHTML = `
                <div class="universal-spinner-content">
                    <div class="loader-container">
                        <span class="loader"></span>
                    </div>
                    <div class="universal-spinner-text" id="spinner-text">Cargando...</div>
                </div>
            `;
            document.body.appendChild(this.spinner);
        } else {
            this.spinner = document.getElementById('universal-spinner');
        }
    }

    // ✅ NUEVO: Función para obtener texto traducido
    getTranslation(key, fallback = 'Cargando...') {
        try {
            // Verificar si las traducciones están disponibles
            if (!window.translations) {
                console.warn('⚠️ Traducciones no cargadas aún para:', key);
                return fallback;
            }
            
            const keys = key.split('.');
            let text = window.translations;
            
            for (const k of keys) {
                if (text && typeof text === 'object' && k in text) {
                    text = text[k];
                } else {
                    console.warn('❌ Clave de traducción no encontrada:', key);
                    return fallback;
                }
            }
            
            return text || fallback;
        } catch (error) {
            console.warn('❌ Error al obtener traducción:', key, error);
            return fallback;
        }
    }

    // Mostrar spinner con texto traducido
    show(textKey = 'spinner.loading') {
        if (this.spinner) {
            const textElement = this.spinner.querySelector('#spinner-text');
            if (textElement) {
                // Si es una clave de traducción, obtener el texto traducido
                // Si es texto plano, usarlo directamente
                const displayText = textKey.includes('.') ? 
                    this.getTranslation(textKey) : textKey;
                textElement.textContent = displayText;
            }
            this.spinner.classList.add('show');
        }
    }

    // Ocultar spinner
    hide() {
        if (this.spinner) {
            this.spinner.classList.remove('show');
        }
    }

    // Mostrar spinner por un tiempo determinado con traducción
    showTemporarily(textKey = 'spinner.loading', duration = 2000) {
        this.show(textKey);
        setTimeout(() => {
            this.hide();
        }, duration);
    }

    // Función para usar con promesas y traducciones
    async withSpinner(promise, textKey = 'spinner.loading') {
        this.show(textKey);
        try {
            const result = await promise;
            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }

    // ✅ NUEVO: Actualizar textos cuando cambie el idioma
    updateTexts() {
        if (this.spinner && this.spinner.classList.contains('show')) {
            const textElement = this.spinner.querySelector('#spinner-text');
            if (textElement) {
                // Si el texto actual parece ser una clave de traducción, actualizarlo
                const currentText = textElement.textContent;
                // Buscar si el texto actual coincide con alguna traducción conocida
                const translationKeys = [
                    'spinner.loading',
                    'spinner.loadingDashboard',
                    'spinner.loadingUserInfo',
                    'spinner.loadingProfile',
                    'spinner.loadingDashboardData',
                    'spinner.processing',
                    'spinner.verifying',
                    'spinner.saving',
                    'spinner.updating'
                ];
                
                for (const key of translationKeys) {
                    const translated = this.getTranslation(key);
                    if (currentText === translated) {
                        // El texto actual es una traducción, actualizarlo
                        textElement.textContent = this.getTranslation(key);
                        break;
                    }
                }
            }
        }
    }
}

// Crear instancia global
const universalSpinner = new UniversalSpinner();

// Hacerlo disponible globalmente
window.universalSpinner = universalSpinner;
window.UniversalSpinner = UniversalSpinner;

// ✅ NUEVO: Función para que i18n.js pueda actualizar los textos del spinner
window.updateSpinnerTexts = function() {
    if (window.universalSpinner) {
        universalSpinner.updateTexts();
    }
};

console.log('🌀 Spinner universal cargado con traducciones');