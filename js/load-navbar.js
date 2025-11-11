// load-navbar.js - Carga la navbar con manejo de autenticación
document.addEventListener('DOMContentLoaded', () => {
  fetch('../html/navbar.html')
    .then(response => response.text())
    .then(data => {
      const placeholder = document.getElementById('navbar-placeholder');
      if (!placeholder) {
        console.error('No se encontró el placeholder de navbar');
        return;
      }
      
      placeholder.innerHTML = data;

      // Inicializar menú de banderas
      initializeFlagMenu(placeholder);
      
      // Ocultar icono de login en páginas de auth
      handleLoginIconVisibility(placeholder);
      
      // Inicializar sistema de autenticación
      initializeAuthSystem();

    })
    .catch(err => console.error('Error cargando navbar:', err));
});

// Menú de banderas
function initializeFlagMenu(placeholder) {
  const flagBtn = placeholder.querySelector('#flag-btn');
  const flagMenu = placeholder.querySelector('#flag-menu');
  const flagOptions = placeholder.querySelectorAll('.flag-option');

  if (!flagBtn || !flagMenu || flagOptions.length === 0) {
    console.log('Elementos del menú de banderas no encontrados');
    return;
  }

  // Mostrar bandera según idioma guardado
  const savedLang = localStorage.getItem('selectedLang') || 'es';
  switch (savedLang) {
    case 'en': flagBtn.className = 'fi fi-us'; break;
    case 'de': flagBtn.className = 'fi fi-de'; break;
    default: flagBtn.className = 'fi fi-mx';
  }

  // Toggle del menú de banderas
  flagBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    flagMenu.style.display = (flagMenu.style.display === 'block') ? 'none' : 'block';
  });

  // Cerrar menú al hacer click fuera
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

      // Cargar idioma si la función existe
      if (window.loadLanguage) {
        window.loadLanguage(lang);
      }
    });
  });
}

// Manejar visibilidad del icono de login
function handleLoginIconVisibility(placeholder) {
  const loginLink = placeholder.querySelector('a.login-icon');
  
  if (!loginLink) return;

  // Ocultar solo el icono de login en login.html y register.html
  const isAuthPage = document.body.classList.contains('login-page') || 
                    document.body.classList.contains('register-page') ||
                    window.location.pathname.includes('login.html') ||
                    window.location.pathname.includes('register.html');

  if (isAuthPage) {
    loginLink.style.display = 'none';
  }
}

// Sistema de autenticación
function initializeAuthSystem() {
  // Esperar a que Supabase esté listo
  if (window.supabase) {
    initAuthManager();
  } else {
    window.addEventListener('supabase-ready', initAuthManager);
  }
}

// Inicializar AuthManager
async function initAuthManager() {
  try {
    // Verificar sesión actual
    const { data: { user }, error } = await window.supabase.auth.getUser();
    
    if (error) {
      console.error('Error verificando sesión:', error);
      showLoginIcon();
      return;
    }
    
    if (user) {
      // Usuario autenticado - cargar perfil y mostrar menú de usuario
      await loadAndShowUserProfile(user.id);
    } else {
      // Usuario no autenticado - mostrar icono de login
      showLoginIcon();
    }
    
    // Configurar event listeners del menú de usuario
    setupUserMenuListeners();
    
  } catch (error) {
    console.error('Error inicializando auth:', error);
    showLoginIcon();
  }
}

// Cargar y mostrar perfil de usuario
async function loadAndShowUserProfile(userId) {
  try {
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Actualizar UI con datos del usuario
    updateUserUI(profile);
    
    // Mostrar menú de usuario
    showUserMenu();
    
  } catch (error) {
    console.error('Error cargando perfil:', error);
    // Mostrar datos básicos del usuario auth
    const { data: { user } } = await window.supabase.auth.getUser();
    updateUserUI({
      user_name: user.email.split('@')[0],
      avatar_url: null
    });
    showUserMenu();
  }
}

// Actualizar UI con datos del usuario
function updateUserUI(profile) {
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  
if (userAvatar) {
  userAvatar.src = profile.avatar_url || '../assets/elements/default-avatar.png';
  userAvatar.alt = (profile.full_name?.split(" ")[0]) || 'Usuario';
}

  
  if (userName) {
    userName.textContent = (profile.full_name?.split(" ")[0]) || 'Usuario';
  }
}

// Mostrar menú de usuario
function showUserMenu() {
  const userMenuContainer = document.getElementById('user-menu-container');
  const loginIcon = document.getElementById('login-icon');
  
  if (userMenuContainer) userMenuContainer.style.display = 'flex';
  if (loginIcon) loginIcon.style.display = 'none';
}

// Mostrar icono de login
function showLoginIcon() {
  const userMenuContainer = document.getElementById('user-menu-container');
  const loginIcon = document.getElementById('login-icon');
  
  if (userMenuContainer) userMenuContainer.style.display = 'none';
  if (loginIcon) loginIcon.style.display = 'flex';
}

// Configurar event listeners del menú de usuario
function setupUserMenuListeners() {
  const userTrigger = document.getElementById('user-trigger');
  const userMenu = document.getElementById('user-menu');
  const logoutBtn = document.getElementById('logout-btn');

  // Toggle del menú de usuario
  if (userTrigger && userMenu) {
    userTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userTrigger.parentElement.classList.toggle('active');
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (event) => {
      if (!userTrigger.contains(event.target) && !userMenu.contains(event.target)) {
        userTrigger.parentElement.classList.remove('active');
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Manejar logout
async function handleLogout() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;
    
    // Redirigir a la página principal
    window.location.href = '../index.html';
    
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    alert('Error al cerrar sesión');
  }
}

// Exportar funciones para uso global (opcional)
window.authUtils = {
  showUserMenu,
  showLoginIcon,
  handleLogout
};