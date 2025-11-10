document.addEventListener('DOMContentLoaded', () => {
  fetch('../html/navbar.html')
    .then(response => response.text())
    .then(data => {
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = data;

      // Elementos de la navbar
      const flagBtn = placeholder.querySelector('#flag-btn');
      const flagMenu = placeholder.querySelector('#flag-menu');
      const flagOptions = placeholder.querySelectorAll('.flag-option');
      const loginLink = placeholder.querySelector('a.login-icon');

      // Ocultar solo el icono de login en login.html
      if (document.body.classList.contains('login-page') && loginLink) {
        loginLink.style.display = 'none';
      }

      // Inicializar menú de bandera
      if (flagBtn && flagMenu && flagOptions.length > 0) {
        // Mostrar bandera según idioma guardado
        const savedLang = localStorage.getItem('selectedLang') || 'es';
        switch (savedLang) {
          case 'en': flagBtn.className = 'fi fi-us'; break;
          case 'de': flagBtn.className = 'fi fi-de'; break;
          default: flagBtn.className = 'fi fi-mx';
        }

        flagBtn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          flagMenu.style.display = (flagMenu.style.display === 'block') ? 'none' : 'block';
        });

        document.addEventListener('click', (event) => {
          if (!flagBtn.contains(event.target) && !flagMenu.contains(event.target)) {
            flagMenu.style.display = 'none';
          }
        });

        // Cambiar bandera y idioma
        flagOptions.forEach(option => {
          option.addEventListener('click', () => {
            const country = option.dataset.country;
            flagBtn.className = `fi fi-${country}`;
            flagMenu.style.display = 'none';

            // Determinar idioma
            let lang = 'es';
            if (country === 'us') lang = 'en';
            if (country === 'de') lang = 'de';

            // Guardar idioma en localStorage
            localStorage.setItem('selectedLang', lang);

            // Cargar idioma
            if (window.loadLanguage) window.loadLanguage(lang);
          });
        });
      }
    })
    .catch(err => console.error('Error cargando navbar:', err));
});
