// main.js - VERSIÓN COMPLETA CON BANNER DE PROYECTOS POPULARES

// Variables globales para el banner
let popularProjects = [];
let currentBannerIndex = 0;
let bannerInterval = null;

// Animación de escritura para el título
function startTypingAnimation(texto) {
  const textoElemento = document.getElementById("texto");
  textoElemento.textContent = '';
  const errorIndex = 8;
  let i = 0;
  let errorHecho = false;

  function escribir() {
    if (i < texto.length) {
      const velocidad = 40 + Math.random() * 60;
      textoElemento.textContent += texto.charAt(i);
      i++;

      if (i === errorIndex && !errorHecho) {
        errorHecho = true;
        textoElemento.textContent += "x";
        setTimeout(() => {
          textoElemento.textContent = textoElemento.textContent.slice(0, -1);
          setTimeout(() => {
            textoElemento.textContent += texto.charAt(i - 1);
            setTimeout(escribir, velocidad);
          }, 150);
        }, 400);
      } else {
        const pausa = texto.charAt(i - 1) === " " ? 150 : 0;
        setTimeout(escribir, velocidad + pausa);
      }
    }
  }

  escribir();
}

// 🚀 CARGAR PROYECTOS POR CATEGORÍAS - VERSIÓN DEFINITIVA
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Esperar a que Supabase esté listo
    await waitForSupabase();
    
    // Esperar a que las traducciones estén cargadas
    await waitForTranslations();
    
    // Cargar banner de proyectos populares
    await loadPopularBanner();
    
    // Cargar proyectos normales
    await loadPublicProjects();
    setupEventListeners();
    
  } catch (error) {
    console.error('❌ Error cargando página principal:', error);
    showError('Error al cargar la página: ' + error.message);
  }
});

// 🔥 FUNCIÓN: Esperar inicialización de Supabase
async function waitForSupabase() {
  // Si Supabase ya está listo, continuar
  if (window.supabase && typeof window.supabase.from === 'function') {
    return true;
  }
  
  // Esperar máximo 8 segundos
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 80; // 8 segundos (80 * 100ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.supabase && typeof window.supabase.from === 'function') {
        clearInterval(checkInterval);
        resolve(true);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Timeout: Supabase no se inicializó después de 8 segundos'));
      }
    }, 100);
  });
}

// 🔥 FUNCIÓN: Esperar traducciones
async function waitForTranslations() {
  if (window.translations) {
    return true;
  }
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.translations) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);
  });
}

// 🔥 NUEVA FUNCIÓN: Cargar banner de proyectos populares
async function loadPopularBanner() {
  try {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      console.error('❌ Supabase no está disponible para el banner');
      return;
    }

    console.log('🔄 Cargando proyectos para el banner...');
    
    // Consulta para proyectos populares (máximo 5 para el banner)
    const { data: projects, error } = await window.supabase
      .from('projects')
      .select('id, name, slug, title, subtitle, description, cover_image_url, status, category, technologies, visibility, created_at, created_by, cached_view_count')
      .eq('visibility', 'public')
      .gt('cached_view_count', 0)
      .order('cached_view_count', { ascending: false })
      .limit(5); // Solo 5 proyectos para el banner

    if (error) {
      console.error('❌ Error cargando proyectos para banner:', error);
      return;
    }

    if (projects && projects.length > 0) {
      // Cargar información de usuarios
      const projectsWithUsers = await loadUsersForProjects(projects);
      popularProjects = projectsWithUsers;
      
      // Mostrar el banner
      displayPopularBanner();
      
      // Iniciar rotación automática cada 8 segundos
      startBannerRotation();
    } else {
      console.log('ℹ️ No hay proyectos populares para mostrar en el banner');
      hidePopularBanner();
    }

  } catch (error) {
    console.error('❌ Error en loadPopularBanner:', error);
    hidePopularBanner();
  }
}

// 🔥 NUEVA FUNCIÓN: Mostrar banner de proyectos populares
function displayPopularBanner() {
  const banner = document.getElementById('popular-banner');
  if (!banner || popularProjects.length === 0) {
    hidePopularBanner();
    return;
  }

  // Mostrar el banner
  banner.classList.remove('hidden');
  
  // Mostrar el primer proyecto
  showBannerProject(0);
  
  // Actualizar contadores
  updateBannerCounters();
}

// 🔥 NUEVA FUNCIÓN: Mostrar proyecto específico en el banner
function showBannerProject(index) {
  const bannerContent = document.getElementById('banner-project-content');
  if (!bannerContent || popularProjects.length === 0) return;

  currentBannerIndex = index;
  const project = popularProjects[index];

  // Crear HTML del proyecto para el banner
  const bannerHTML = `
    <div class="banner-project-card">
      <div class="banner-project-media">
        ${project.cover_image_url ? `
          <img src="${project.cover_image_url}" alt="${project.title || project.name}" class="banner-cover">
        ` : `
          <div class="banner-cover-placeholder">
            <i class="fas fa-rocket"></i>
          </div>
        `}
      </div>
      
      <div class="banner-project-info">
        <div class="banner-project-header">
          <h3 class="banner-project-title">${project.title || project.name}</h3>
          <div class="banner-project-stats">
            <span class="view-count">
              <i class="fas fa-eye"></i>
              ${project.cached_view_count || 0} vistas
            </span>
          </div>
        </div>
        
        <p class="banner-project-description">
          ${project.subtitle || project.description?.substring(0, 150) || 'Sin descripción disponible'}...
        </p>
        
        <div class="banner-project-meta">
          <div class="banner-author">
            ${project.profiles?.avatar_url ? `
              <img src="${project.profiles.avatar_url}" alt="${project.profiles.full_name}" class="banner-avatar">
            ` : `
              <div class="banner-avatar placeholder">
                <i class="fas fa-user"></i>
              </div>
            `}
            <span class="banner-author-name">
              ${project.profiles?.first_name || project.profiles?.full_name || 'Usuario'}
            </span>
          </div>
          
          <div class="banner-project-category">
            <i class="fas fa-tag"></i>
            ${project.category || 'Sin categoría'}
          </div>
        </div>
        
        ${project.technologies && project.technologies.length > 0 ? `
          <div class="banner-technologies">
            ${project.technologies.slice(0, 4).map(tech => `
              <span class="banner-tech-tag">${tech}</span>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="banner-actions">
          <button class="btn-banner-view" data-project-slug="${project.slug}">
            <i class="fas fa-eye"></i>
            Ver Proyecto
          </button>
        </div>
      </div>
    </div>
  `;

  bannerContent.innerHTML = bannerHTML;
  
  // Conectar evento del botón
  const viewButton = bannerContent.querySelector('.btn-banner-view');
  if (viewButton) {
    viewButton.addEventListener('click', () => {
      const slug = viewButton.getAttribute('data-project-slug');
      if (slug) {
        window.location.href = `/proyectos/${slug}`;
      }
    });
  }
  
  // Actualizar contadores
  updateBannerCounters();
}

// 🔥 NUEVA FUNCIÓN: Actualizar contadores del banner
function updateBannerCounters() {
  const currentElement = document.getElementById('banner-current');
  const totalElement = document.getElementById('banner-total');
  
  if (currentElement) {
    currentElement.textContent = currentBannerIndex + 1;
  }
  
  if (totalElement) {
    totalElement.textContent = popularProjects.length;
  }
}

// 🔥 NUEVA FUNCIÓN: Iniciar rotación automática del banner
function startBannerRotation() {
  if (popularProjects.length <= 1) return;
  
  // Limpiar intervalo anterior si existe
  if (bannerInterval) {
    clearInterval(bannerInterval);
  }
  
  // Rotar cada 8 segundos
  bannerInterval = setInterval(() => {
    nextBannerProject();
  }, 8000);
}

// 🔥 NUEVA FUNCIÓN: Siguiente proyecto en el banner
function nextBannerProject() {
  if (popularProjects.length === 0) return;
  
  currentBannerIndex = (currentBannerIndex + 1) % popularProjects.length;
  showBannerProject(currentBannerIndex);
}

// 🔥 NUEVA FUNCIÓN: Proyecto anterior en el banner
function prevBannerProject() {
  if (popularProjects.length === 0) return;
  
  currentBannerIndex = (currentBannerIndex - 1 + popularProjects.length) % popularProjects.length;
  showBannerProject(currentBannerIndex);
}

// 🔥 NUEVA FUNCIÓN: Ocultar banner
function hidePopularBanner() {
  const banner = document.getElementById('popular-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
  
  // Limpiar intervalo
  if (bannerInterval) {
    clearInterval(bannerInterval);
    bannerInterval = null;
  }
}

// 🔥 FUNCIÓN PRINCIPAL: Cargar proyectos públicos (VERSIÓN CORREGIDA)
async function loadPublicProjects(searchTerm = '') {
  try {
    showLoading(true);
    
    // Verificación robusta de Supabase
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      console.error('❌ Supabase no está disponible');
      showError('Error de conexión con la base de datos. Recarga la página.');
      return;
    }

    // 🔥 CONSULTA CORREGIDA - SIN RELACIONES PARA EVITAR ERRORES
    let query = window.supabase
      .from('projects')
      .select('id, name, slug, title, subtitle, description, cover_image_url, status, category, technologies, visibility, created_at, created_by')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    // 🔥 CORRECCIÓN: Aplicar filtro de búsqueda de forma segura
    if (searchTerm && searchTerm.trim() !== '') {
      // 🔥 OPCIÓN 1: Solo buscar en título y descripción (más seguro)
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('❌ Error cargando proyectos:', error);
      showError('Error al cargar proyectos: ' + error.message);
      return;
    }

    // 🔥 CARGAR INFORMACIÓN DE USUARIOS POR SEPARADO
    const projectsWithUsers = await loadUsersForProjects(projects || []);
    
    // Agrupar proyectos por categoría
    const projectsByCategory = groupProjectsByCategory(projectsWithUsers);
    
    // Mostrar proyectos en la interfaz
    displayProjectsByCategory(projectsByCategory, searchTerm);

  } catch (error) {
    console.error('❌ Error cargando proyectos públicos:', error);
    showError('Error inesperado: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 🔥 FUNCIÓN CORREGIDA: Cargar información de usuarios para los proyectos
async function loadUsersForProjects(projects) {
    if (!projects || projects.length === 0) return projects;

    try {
        // Obtener IDs únicos de usuarios
        const userIds = [...new Set(projects.map(p => p.created_by).filter(Boolean))];
        
        if (userIds.length === 0) {
            return projects.map(project => ({
                ...project,
                profiles: { 
                    username: 'Usuario', 
                    full_name: 'Usuario',
                    first_name: 'Usuario'
                }
            }));
        }

        let users = [];
        
        // 🔥 ESTRATEGIA PRINCIPAL: Cargar desde la tabla profiles
        try {
            const { data: profilesData, error: profilesError } = await window.supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', userIds);
            
            if (!profilesError && profilesData && profilesData.length > 0) {
                users = profilesData;
            } else {
                throw new Error('Fallback a auth.users');
            }
        } catch (profilesError) {
            // Estrategia de respaldo: auth.users
            try {
                const { data: authUsers, error: authError } = await window.supabase
                    .from('auth.users')
                    .select('id, email, user_metadata')
                    .in('id', userIds);
                
                if (!authError && authUsers && authUsers.length > 0) {
                    users = authUsers.map(user => ({
                        id: user.id,
                        username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'usuario',
                        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                        avatar_url: user.user_metadata?.avatar_url || null,
                        email: user.email
                    }));
                } else {
                    throw new Error('Usar datos por defecto');
                }
            } catch (authError) {
                // Crear datos de usuario por defecto
                users = userIds.map(id => ({
                    id: id,
                    username: 'usuario_' + id.substring(0, 8),
                    full_name: 'Usuario',
                    avatar_url: null
                }));
            }
        }

        // Si no se cargaron usuarios, crear datos por defecto
        if (users.length === 0) {
            users = userIds.map(id => ({
                id: id,
                username: 'usuario_' + id.substring(0, 8),
                full_name: 'Usuario',
                avatar_url: null
            }));
        }

        // Crear mapa de usuarios por ID
        const usersMap = {};
        users.forEach(user => {
            const firstName = extractFirstName(user.full_name);
            usersMap[user.id] = {
                ...user,
                first_name: firstName
            };
        });

        // Combinar proyectos con información de usuarios
        const projectsWithUsers = projects.map(project => {
            const userInfo = usersMap[project.created_by] || {
                username: 'usuario_' + (project.created_by ? project.created_by.substring(0, 8) : 'anon'),
                full_name: 'Usuario',
                first_name: 'Usuario',
                avatar_url: null
            };
            
            return {
                ...project,
                profiles: userInfo
            };
        });

        return projectsWithUsers;

    } catch (error) {
        console.error('❌ Error combinando datos:', error);
        // Retornar proyectos con datos de usuario por defecto
        return projects.map(project => ({
            ...project,
            profiles: { 
                username: 'usuario_' + (project.created_by ? project.created_by.substring(0, 8) : 'anon'),
                full_name: 'Usuario',
                first_name: 'Usuario',
                avatar_url: null 
            }
        }));
    }
}

// 🔥 NUEVA FUNCIÓN: Extraer primer nombre de full_name
function extractFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'Usuario';
    }
    
    const trimmedName = fullName.trim();
    if (trimmedName === '') {
        return 'Usuario';
    }
    
    const firstName = trimmedName.split(' ')[0];
    return firstName || 'Usuario';
}

// 🔥 FUNCIÓN: Agrupar proyectos por categoría
function groupProjectsByCategory(projects) {
  const categories = {};
  
  projects.forEach(project => {
    const category = project.category || 'sin-categoria';
    
    if (!categories[category]) {
      categories[category] = {
        name: category,
        displayName: getCategoryDisplayName(category),
        projects: []
      };
    }
    
    categories[category].projects.push(project);
  });
  
  // Ordenar categorías por número de proyectos (descendente)
  return Object.values(categories).sort((a, b) => b.projects.length - a.projects.length);
}

// 🔥 FUNCIÓN: Obtener nombre display para categoría
function getCategoryDisplayName(category) {
  const categoryNames = {
    'web-development': 'Desarrollo Web',
    'mobile': 'Apps Móviles',
    'ai-ml': 'IA & Machine Learning',
    'blockchain': 'Blockchain',
    'design': 'Diseño',
    'games': 'Videojuegos',
    'iot': 'IoT & Hardware',
    'tools': 'Herramientas',
    'education': 'Educación',
    'business': 'Negocios',
    'sin-categoria': 'Sin Categoría'
  };
  
  return categoryNames[category] || category;
}

// 🔥 FUNCIÓN: Mostrar proyectos agrupados por categoría
function displayProjectsByCategory(categories, searchTerm = '') {
  const container = document.getElementById('projects-container');
  const emptyState = document.getElementById('empty-state');
  
  if (!container) {
    console.error('❌ Contenedor de proyectos no encontrado');
    return;
  }
  
  // Verificar si hay proyectos
  const totalProjects = categories.reduce((total, category) => total + category.projects.length, 0);
  
  if (totalProjects === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    
    const message = searchTerm ? 
      'No se encontraron proyectos para tu búsqueda' : 
      'Aún no hay proyectos públicos disponibles';
    
    const messageElement = emptyState.querySelector('p');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Generar HTML para cada categoría
  const categoriesHTML = categories.map(category => `
    <div class="category-section" data-category="${category.name}">
      <div class="category-header">
        <h2 class="category-title">${category.displayName}</h2>
        <span class="project-count">${category.projects.length} proyecto${category.projects.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div class="projects-grid">
        ${category.projects.map(project => `
          <div class="project-card" data-project-id="${project.id}">
            <div class="project-media-container">
              ${project.cover_image_url ? `
                <div class="project-cover">
                  <img src="${project.cover_image_url}" alt="${project.title || project.name}" loading="lazy">
                  <div class="project-title-overlay">
                    <h3 class="project-title">${project.title || project.name}</h3>
                  </div>
                  <div class="project-status ${project.status}">
                    <i class="fas ${getStatusIcon(project.status)}"></i>
                    <span>${getStatusText(project.status)}</span>
                  </div>
                </div>
              ` : `
                <div class="project-cover no-image">
                  <div class="project-cover-placeholder">
                    <i class="fas fa-rocket"></i>
                  </div>
                  <div class="project-title-overlay">
                    <h3 class="project-title">${project.title || project.name}</h3>
                  </div>
                  <div class="project-status ${project.status}">
                    <i class="fas ${getStatusIcon(project.status)}"></i>
                    <span>${getStatusText(project.status)}</span>
                  </div>
                </div>
              `}
            </div>
            
            <div class="project-card-content">
              <p class="project-subtitle">${project.subtitle || project.description?.substring(0, 120) || 'Sin descripción disponible'}...</p>
              
              <div class="project-author">
                <div class="author-info">
                  ${project.profiles?.avatar_url ? `
                    <img src="${project.profiles.avatar_url}" alt="${project.profiles.full_name || project.profiles.username}" class="author-avatar">
                  ` : `
                    <div class="author-avatar placeholder">
                      <i class="fas fa-user"></i>
                    </div>
                  `}
                  <span class="author-name">${project.profiles?.first_name || project.profiles?.full_name || project.profiles?.username || 'Usuario'}</span>
                </div>
              </div>
              
              <div class="project-meta">
                <div class="project-category">
                  <i class="fas fa-tag"></i>
                  <span>${project.category || 'Sin categoría'}</span>
                </div>
                <div class="project-visibility ${project.visibility}">
                  <i class="fas ${getVisibilityIcon(project.visibility)}"></i>
                  <span>${getVisibilityText(project.visibility)}</span>
                </div>
              </div>
              
              ${project.technologies && project.technologies.length > 0 ? `
                <div class="project-technologies">
                  ${project.technologies.slice(0, 3).map(tech => `
                    <span class="tech-tag">${tech}</span>
                  `).join('')}
                  ${project.technologies.length > 3 ? `
                    <span class="tech-tag-more">+${project.technologies.length - 3}</span>
                  ` : ''}
                </div>
              ` : ''}
              
              <div class="project-actions">
                <button class="btn-view-project" data-project-slug="${project.slug}">
                  <i class="fas fa-eye"></i>
                  <span>Ver Proyecto</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = categoriesHTML;
  
  // Conectar eventos de los botones
  connectProjectActions();
  
  // Actualizar traducciones si es necesario
  if (window.updateTranslations) {
    setTimeout(() => window.updateTranslations(), 100);
  }
}

// 🔧 FUNCIÓN: Configurar event listeners (ACTUALIZADA CON BANNER)
function setupEventListeners() {
  // Navegación del banner
  const prevBtn = document.getElementById('prev-banner');
  const nextBtn = document.getElementById('next-banner');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', prevBannerProject);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', nextBannerProject);
  }
  
  // Navegación entre secciones (quitamos la sección populares)
  const sectionButtons = document.querySelectorAll('.categorias button');
  sectionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remover clase active de todos los botones
      sectionButtons.forEach(btn => btn.classList.remove('active'));
      // Agregar clase active al botón clickeado
      e.target.classList.add('active');
      
      const section = e.target.getAttribute('data-section');
      
      if (section === 'proyectos') {
        loadPublicProjects();
      }
      // Aquí puedes agregar más secciones según sea necesario
    });
  });
  
  // 🔍 Buscador
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      loadPublicProjects(searchTerm);
    });
  }
}

// 🔥 FUNCIÓN: Conectar acciones de proyectos
function connectProjectActions() {
    const viewButtons = document.querySelectorAll('.btn-view-project');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const slug = e.currentTarget.getAttribute('data-project-slug');
            if (slug) {
                window.location.href = `/proyectos/${slug}`;
            }
        });
    });
}

// 🔥 FUNCIONES AUXILIARES
function getStatusIcon(status) {
  const icons = {
    'planning': 'fa-lightbulb',
    'development': 'fa-code',
    'launched': 'fa-rocket',
    'completed': 'fa-check-circle',
    'paused': 'fa-pause-circle'
  };
  return icons[status] || 'fa-question';
}

function getStatusText(status) {
  const texts = {
    'planning': 'En Planificación',
    'development': 'En Desarrollo', 
    'launched': 'Lanzado',
    'completed': 'Completado',
    'paused': 'En Pausa'
  };
  return texts[status] || status;
}

function getVisibilityIcon(visibility) {
  const icons = {
    'public': 'fa-globe-americas',
    'private': 'fa-lock',
    'link-only': 'fa-link',
    'draft': 'fa-eye-slash'
  };
  return icons[visibility] || 'fa-question';
}

function getVisibilityText(visibility) {
  const texts = {
    'public': 'Público',
    'private': 'Privado',
    'link-only': 'Solo Enlace',
    'draft': 'Borrador'
  };
  return texts[visibility] || visibility;
}

// 🔥 FUNCIONES DE UI
function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  const container = document.getElementById('projects-container');
  const emptyState = document.getElementById('empty-state');
  
  if (container) {
    container.innerHTML = '';
  }
  
  if (emptyState) {
    emptyState.classList.remove('hidden');
    const messageElement = emptyState.querySelector('p');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    const iconElement = emptyState.querySelector('i');
    if (iconElement) {
      iconElement.className = 'fas fa-exclamation-triangle';
    }
  }
}

// 🔥 FUNCIÓN: Recargar proyectos
window.reloadProjects = function() {
  loadPublicProjects();
};

// Exportamos las funciones para el banner
window.nextBannerProject = nextBannerProject;
window.prevBannerProject = prevBannerProject;

// Exportamos la función para que i18n.js la use
window.startTypingAnimation = startTypingAnimation;

// Manejar errores no capturados
window.addEventListener('error', function(e) {
  console.error('❌ Error global:', e.error);
  if (window.universalSpinner) {
    universalSpinner.hide();
  }
});

// Manejar promesas no capturadas
window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ Promesa no manejada:', e.reason);
  e.preventDefault();
});