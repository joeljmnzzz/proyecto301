// spinner.js - Spinner Universal con traducciones MEJORADO
class UniversalSpinner {
    constructor() {
        this.spinner = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeSpinner();
            });
        } else {
            this.initializeSpinner();
        }
    }

    initializeSpinner() {
        try {
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
            
            this.isInitialized = true;
            console.log('✅ Spinner universal inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando spinner:', error);
            this.isInitialized = false;
        }
    }

    // ✅ MEJORADO: Función para obtener texto traducido con mejor manejo de errores
    getTranslation(key, fallback = 'Cargando...') {
        // Si no hay traducciones disponibles, usar fallback
        if (!window.translations) {
            console.warn('⚠️ Traducciones no disponibles, usando fallback para:', key);
            return fallback;
        }
        
        try {
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

    // ✅ MEJORADO: Mostrar spinner con verificación de inicialización
    show(textKey = 'spinner.loading') {
        if (!this.isInitialized) {
            console.warn('⚠️ Spinner no inicializado, intentando inicializar...');
            this.initializeSpinner();
        }
        
        if (this.spinner) {
            const textElement = this.spinner.querySelector('#spinner-text');
            if (textElement) {
                try {
                    const displayText = textKey.includes('.') ? 
                        this.getTranslation(textKey) : textKey;
                    textElement.textContent = displayText;
                } catch (error) {
                    console.warn('❌ Error estableciendo texto del spinner:', error);
                    textElement.textContent = 'Cargando...';
                }
            }
            this.spinner.classList.add('show');
        } else {
            console.error('❌ No se puede mostrar: spinner no disponible');
            // Fallback: mostrar un spinner básico
            this.createFallbackSpinner();
        }
    }

    // ✅ NUEVO: Spinner de emergencia
    createFallbackSpinner() {
        const fallbackSpinner = document.createElement('div');
        fallbackSpinner.id = 'fallback-spinner';
        fallbackSpinner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: Arial, sans-serif;
        `;
        fallbackSpinner.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 20px;">Cargando...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(fallbackSpinner);
        return fallbackSpinner;
    }

    hide() {
        // Ocultar spinner universal
        if (this.spinner) {
            this.spinner.classList.remove('show');
        }
        
        // Ocultar spinner de emergencia si existe
        const fallbackSpinner = document.getElementById('fallback-spinner');
        if (fallbackSpinner) {
            fallbackSpinner.remove();
        }
    }

    // ✅ MEJORADO: Verificar disponibilidad
    isAvailable() {
        return this.isInitialized && this.spinner !== null;
    }
}

// ✅ MEJORADO: Inicialización más robusta
let universalSpinner;

function initializeUniversalSpinner() {
    try {
        universalSpinner = new UniversalSpinner();
        window.universalSpinner = universalSpinner;
        window.UniversalSpinner = UniversalSpinner;
        
        console.log('🌀 Spinner universal cargado con traducciones');
        return universalSpinner;
    } catch (error) {
        console.error('❌ Error creando spinner universal:', error);
        // Crear una versión mínima de emergencia
        universalSpinner = {
            show: () => console.warn('⚠️ Spinner no disponible'),
            hide: () => console.warn('⚠️ Spinner no disponible'),
            isAvailable: () => false
        };
        window.universalSpinner = universalSpinner;
        return universalSpinner;
    }
}

// ✅ Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUniversalSpinner);
} else {
    initializeUniversalSpinner();
}

// ✅ Función global para actualizar textos
window.updateSpinnerTexts = function() {
    if (window.universalSpinner && universalSpinner.updateTexts) {
        universalSpinner.updateTexts();
    }
};