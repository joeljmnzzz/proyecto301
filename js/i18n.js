// i18n.js - VERSIÓN CORREGIDA CON SPINNER

const defaultLang = 'es';
let currentLang = defaultLang;
let translations = {};

// Cargar JSON de idioma
async function loadLanguage(lang) {
  try {
    // ✅ CORREGIR RUTA: Usar ../languages/ para dashboard.html
    const basePath = window.location.pathname.includes('/html/') ? '../languages/' : 'languages/';
    const res = await fetch(`${basePath}${lang}.json`);
    
    if (!res.ok) throw new Error(`No se pudo cargar ${lang}.json`);
    
    translations = await res.json();
    currentLang = lang;

    // Guardar idioma seleccionado
    localStorage.setItem('selectedLang', lang);

    updateTexts();
    
    // EXPONER TRADUCCIONES GLOBALMENTE
    window.translations = translations;
    
    console.log(`✅ Idioma cargado: ${lang}`);
    
  } catch (err) {
    console.error(`❌ Error cargando idioma ${lang}:`, err);
    
    // ✅ FALLBACK: Cargar idioma por defecto si el seleccionado falla
    if (lang !== defaultLang) {
      console.log(`🔄 Intentando cargar idioma por defecto: ${defaultLang}`);
      loadLanguage(defaultLang);
    }
  }
}

// Actualizar todos los textos
function updateTexts() {
  if (!translations || Object.keys(translations).length === 0) {
    console.warn('⚠️ No hay traducciones disponibles');
    return;
  }

  console.log('🔄 Actualizando textos...');

  // ✅ CORREGIDO: Mejor manejo de elementos con data-key
  document.querySelectorAll('[data-key]').forEach(el => {
    try {
      const keys = el.getAttribute('data-key').split('.');
      let text = translations;
      
      for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
          text = text[k];
        } else {
          text = null;
          break;
        }
      }
      
      if (text && typeof text === 'string') {
        el.textContent = text;
      }
    } catch (error) {
      console.warn(`❌ Error actualizando elemento con data-key: ${el.getAttribute('data-key')}`, error);
    }
  });

  // ✅ CORREGIDO: Elementos con data-key-placeholder
  document.querySelectorAll('[data-key-placeholder]').forEach(el => {
    try {
      const keys = el.getAttribute('data-key-placeholder').split('.');
      let text = translations;
      
      for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
          text = text[k];
        } else {
          text = null;
          break;
        }
      }
      
      if (text && typeof text === 'string') {
        el.placeholder = text;
      }
    } catch (error) {
      console.warn(`❌ Error actualizando placeholder: ${el.getAttribute('data-key-placeholder')}`, error);
    }
  });

  // ✅ CORREGIDO: Actualizar logo alt de forma segura
  try {
    if (translations.navbar && translations.navbar.logoAlt) {
      const logo = document.getElementById('logo-alt');
      if (logo) logo.alt = translations.navbar.logoAlt;
    }
  } catch (error) {
    console.warn('❌ Error actualizando logo alt:', error);
  }

  // ✅ CORREGIDO: Animación del título principal
  try {
    if (translations.main && translations.main.titulo) {
      if (window.startTypingAnimation) {
        window.startTypingAnimation(translations.main.titulo);
      }
    }
  } catch (error) {
    console.warn('❌ Error en animación del título:', error);
  }

  // ✅ CORREGIDO: Traducir login de forma más robusta
  try {
    if (translations.login) {
      const loginTitle = document.querySelector('.login-box h1');
      if (loginTitle && translations.login.titulo) {
        loginTitle.textContent = translations.login.titulo;
      }

      const emailInput = document.querySelector('input[name="email"]');
      if (emailInput && translations.login.correo) {
        emailInput.placeholder = translations.login.correo;
      }

      const passwordInput = document.querySelector('input[name="password"]');
      if (passwordInput && translations.login.contrasena) {
        passwordInput.placeholder = translations.login.contrasena;
      }

      const loginButton = document.querySelector('.login-box button[type="submit"]');
      if (loginButton && translations.login.boton) {
        loginButton.textContent = translations.login.boton;
      }

      // Usar data-key en lugar de selección por contenido
      const switchText = document.querySelector('[data-key="login.noCuenta"]');
      const switchLink = document.querySelector('[data-key="login.registrate"]');
      
      if (switchText && translations.login.noCuenta) {
        switchText.textContent = translations.login.noCuenta;
      }
      if (switchLink && translations.login.registrate) {
        switchLink.textContent = translations.login.registrate;
      }
    }
  } catch (error) {
    console.warn('❌ Error actualizando login:', error);
  }

  // ✅ CORREGIDO: Traducir registro de forma más robusta
  try {
    if (translations.register) {
      const registerTitle = document.querySelector('[data-key="register.titulo"]');
      if (registerTitle && translations.register.titulo) {
        registerTitle.textContent = translations.register.titulo;
      }

      const nameInput = document.querySelector('input[name="name"]');
      if (nameInput && translations.register.nombre) {
        nameInput.placeholder = translations.register.nombre;
      }

      const confirmInput = document.querySelector('input[name="confirmPassword"]');
      if (confirmInput && translations.register.confirmarContrasena) {
        confirmInput.placeholder = translations.register.confirmarContrasena;
      }

      const registerButton = document.querySelector('[data-key="register.boton"]');
      if (registerButton && translations.register.boton) {
        registerButton.textContent = translations.register.boton;
      }

      const switchText = document.querySelector('[data-key="register.siCuenta"]');
      const switchLink = document.querySelector('[data-key="register.iniciaSesion"]');
      
      if (switchText && translations.register.siCuenta) {
        switchText.textContent = translations.register.siCuenta;
      }
      if (switchLink && translations.register.iniciaSesion) {
        switchLink.textContent = translations.register.iniciaSesion;
      }
    }
  } catch (error) {
    console.warn('❌ Error actualizando registro:', error);
  }

  // ✅ NUEVO: Llamar a funciones específicas de otras páginas
  if (window.updateDashboardTexts) {
    window.updateDashboardTexts();
  }

  // ✅ NUEVO: Actualizar textos del spinner si está visible
  if (window.updateSpinnerTexts) {
    window.updateSpinnerTexts();
  }

  console.log('✅ Textos actualizados correctamente');
}

// Exportamos las funciones para uso global
window.loadLanguage = loadLanguage;
window.updateTexts = updateTexts;
window.currentTranslations = () => translations;

// ✅ CORREGIDO: Inicialización más robusta
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 Inicializando sistema de idiomas...');
  
  const savedLang = localStorage.getItem('selectedLang') || defaultLang;
  
  // Pequeño delay para asegurar que todo esté cargado
  setTimeout(() => {
    loadLanguage(savedLang);
  }, 100);
});

// ✅ NUEVO: Recargar traducciones cuando cambie el idioma
window.addEventListener('languageChanged', (event) => {
  if (event.detail && event.detail.lang) {
    loadLanguage(event.detail.lang);
  }
});