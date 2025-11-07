const defaultLang = 'es';
let currentLang = defaultLang;
let translations = {};

// Cargar JSON de idioma
async function loadLanguage(lang) {
  try {
    // ✅ Cambiado i18n/ a languages/
    const res = await fetch(`languages/${lang}.json`);
    if (!res.ok) throw new Error(`No se pudo cargar ${lang}.json`);
    translations = await res.json();
    currentLang = lang;
    updateTexts();
  } catch (err) {
    console.error(`Error loading language ${lang}:`, err);
  }
}

// Actualizar todos los textos
function updateTexts() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const keys = el.getAttribute('data-key').split('.');
    let text = translations;
    keys.forEach(k => {
      if (text) text = text[k];
    });
    if (text) el.textContent = text;
  });

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

  // Animación del título
  if (translations.main && translations.main.titulo) {
    if (window.startTypingAnimation) {
      window.startTypingAnimation(translations.main.titulo);
    }
  }
}

// Cambiar idioma al hacer clic en la bandera
document.querySelectorAll('.flag-option').forEach(option => {
  option.addEventListener('click', () => {
    const country = option.getAttribute('data-country');
    let lang = 'es';
    if (country === 'us') lang = 'en';
    if (country === 'de') lang = 'de';
    loadLanguage(lang);
  });
});

// Inicializar con idioma por defecto
document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(defaultLang);
});
