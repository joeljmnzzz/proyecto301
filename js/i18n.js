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

    const registerText = document.querySelector('.login-box p');
    if (registerText && translations.login.noCuenta && translations.login.registrate) {
      registerText.innerHTML = `${translations.login.noCuenta} <a href="#">${translations.login.registrate}</a>`;
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
