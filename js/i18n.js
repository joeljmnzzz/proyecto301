// i18n.js

const defaultLang = 'es';
let currentLang = defaultLang;
let translations = {};

// Cargar JSON de idioma
async function loadLanguage(lang) {
  try {
    const res = await fetch(`languages/${lang}.json`);
    if (!res.ok) throw new Error(`No se pudo cargar ${lang}.json`);
    translations = await res.json();
    currentLang = lang;

    // Guardar idioma seleccionado
    localStorage.setItem('selectedLang', lang);

    updateTexts();
  } catch (err) {
    console.error(`Error loading language ${lang}:`, err);
  }
}

// Actualizar todos los textos
function updateTexts() {
  // Elementos con data-key
  document.querySelectorAll('[data-key]').forEach(el => {
    const keys = el.getAttribute('data-key').split('.');
    let text = translations;
    keys.forEach(k => {
      if (text) text = text[k];
    });
    if (text) el.textContent = text;
  });

  // Elementos con data-key-placeholder
  document.querySelectorAll('[data-key-placeholder]').forEach(el => {
    const keys = el.getAttribute('data-key-placeholder').split('.');
    let text = translations;
    keys.forEach(k => {
      if (text) text = text[k];
    });
    if (text) el.placeholder = text;
  });

  // Actualizar logo alt
  if (translations.navbar && translations.navbar.logoAlt) {
    const logo = document.getElementById('logo-alt');
    if (logo) logo.alt = translations.navbar.logoAlt;
  }

  // Animación del título principal (main)
  if (translations.main && translations.main.titulo) {
    if (window.startTypingAnimation) {
      window.startTypingAnimation(translations.main.titulo);
    }
  }

  // Traducir login si existe
 if (translations.login) {
    const loginTitle = document.querySelector('.login-box h1');
    if (loginTitle && translations.login.titulo) loginTitle.textContent = translations.login.titulo;

    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput && translations.login.correo) emailInput.placeholder = translations.login.correo;

    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput && translations.login.contrasena) passwordInput.placeholder = translations.login.contrasena;

    const loginButton = document.querySelector('.login-box button[type="submit"]');
    if (loginButton && translations.login.boton) loginButton.textContent = translations.login.boton;

    // SOLUCIÓN: Solo actualizar textos, no reemplazar HTML completo
    const switchText = document.querySelector('.login-box p span[data-key="login.noCuenta"]');
    const switchLink = document.querySelector('.login-box a[data-key="login.registrate"]');
    
    if (switchText && translations.login.noCuenta) {
      switchText.textContent = translations.login.noCuenta;
    }
    if (switchLink && translations.login.registrate) {
      switchLink.textContent = translations.login.registrate;
    }
  }

  // También actualizar textos de registro si estamos en ese modo
  if (translations.register) {
    const registerTitle = document.querySelector('.login-box h1[data-key="register.titulo"]');
    if (registerTitle && translations.register.titulo) registerTitle.textContent = translations.register.titulo;

    const nameInput = document.querySelector('input[name="name"]');
    if (nameInput && translations.register.nombre) nameInput.placeholder = translations.register.nombre;

    const confirmInput = document.querySelector('input[name="confirmPassword"]');
    if (confirmInput && translations.register.confirmarContrasena) confirmInput.placeholder = translations.register.confirmarContrasena;

    const registerButton = document.querySelector('.login-box button[data-key="register.boton"]');
    if (registerButton && translations.register.boton) registerButton.textContent = translations.register.boton;

    const switchText = document.querySelector('.login-box p span[data-key="register.siCuenta"]');
    const switchLink = document.querySelector('.login-box a[data-key="register.iniciaSesion"]');
    
    if (switchText && translations.register.siCuenta) {
      switchText.textContent = translations.register.siCuenta;
    }
    if (switchLink && translations.register.iniciaSesion) {
      switchLink.textContent = translations.register.iniciaSesion;
    }
  }
}

// Exportamos la función para usarla desde load-navbar.js
window.loadLanguage = loadLanguage;

// Inicializar idioma según localStorage o por defecto
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('selectedLang') || defaultLang;
  loadLanguage(savedLang);
});
