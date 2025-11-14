// main.js - VERSIÓN ACTUALIZADA CON NUEVA ESTRUCTURA DE BANNER

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

// 🚀 CARGAR PROYECTOS POR CATEGORÍAS
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
  if (window.supabase && typeof window.supabase.from === 'function') {
    return true;
  }
  
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 80;
    
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

// 🔥 FUNCIÓN: Navegar al perfil del usuario
function navigateToProfile(userIdentifier) {
    if (!userIdentifier) {
        console.warn('No se puede navegar al perfil: identificador de usuario no disponible');
        return;
    }

    const profileUrl = `/perfiles/${userIdentifier}`;
    console.log('🔗 Navegando al perfil:', profileUrl);
    window.location.href = profileUrl;
}

// 🔥 FUNCIÓN: Controlar visibilidad del banner basado en búsqueda
function toggleBannerVisibility(show) {
  const banner = document.getElementById('popular-banner');
  if (!banner) return;
  
  if (show) {
    banner.classList.remove('hidden');
    if (popularProjects.length > 1 && !bannerInterval) {
      startBannerRotation();
    }
  } else {
    banner.classList.add('hidden');
    if (bannerInterval) {
      clearInterval(bannerInterval);
      bannerInterval = null;
    }
  }
}

// 🔥 FUNCIÓN: Cargar banner de proyectos populares
async function loadPopularBanner() {
  try {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      console.error('❌ Supabase no está disponible para el banner');
      return;
    }

    console.log('🔄 Cargando proyectos para el banner...');
    
    const { data: projects, error } = await window.supabase
      .from('projects')
      .select('id, name, slug, title, subtitle, description, cover_image_url, status, category, technologies, visibility, created_at, created_by, cached_view_count')
      .eq('visibility', 'public')
      .gt('cached_view_count', 0)
      .order('cached_view_count', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error cargando proyectos para banner:', error);
      return;
    }

    if (projects && projects.length > 0) {
      const projectsWithUsers = await loadUsersForProjects(projects);
      popularProjects = projectsWithUsers;
      displayPopularBanner();
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

// 🔥 FUNCIÓN: Mostrar banner de proyectos populares
function displayPopularBanner() {
  const banner = document.getElementById('popular-banner');
  if (!banner || popularProjects.length === 0) {
    hidePopularBanner();
    return;
  }

  banner.classList.remove('hidden');
  showBannerProject(0);
  updateBannerCounters();
}

// 🔥 FUNCIÓN ACTUALIZADA: Mostrar proyecto específico en el banner
function showBannerProject(index) {
  const banner = document.getElementById('popular-banner');
  const bannerContent = document.getElementById('banner-project-content');
  if (!bannerContent || popularProjects.length === 0) return;

  currentBannerIndex = index;
  const project = popularProjects[index];

  // Manejar fondo de imagen
  if (project.cover_image_url) {
    banner.classList.add('with-background');
    banner.style.setProperty('--banner-image', `url('${project.cover_image_url}')`);
  } else {
    banner.classList.remove('with-background');
    banner.style.removeProperty('--banner-image');
  }

  // Usar template
  const template = document.getElementById('banner-template');
  if (!template) {
    console.error('❌ Template del banner no encontrado');
    return;
  }

  const clone = template.content.cloneNode(true);
  
  // Llenar el template con datos del proyecto
  const titleElement = clone.querySelector('.banner-project-title');
  const subtitleElement = clone.querySelector('.banner-project-subtitle');
  const descriptionElement = clone.querySelector('.banner-project-description');
  const authorNameElement = clone.querySelector('.banner-author-name');
  const viewCountElement = clone.querySelector('.view-count');
  const viewButton = clone.querySelector('.btn-banner-view');
  const statusBadge = document.querySelector('.banner-status-badge .status-text');

  if (titleElement) {
    titleElement.textContent = project.title || project.name;
  }

  if (subtitleElement) {
    subtitleElement.textContent = project.subtitle || 'Proyecto innovador';
  }

  if (descriptionElement) {
    descriptionElement.textContent = 
      project.description?.substring(0, 120) || 
      'Descripción del proyecto destacado...';
  }

  if (authorNameElement) {
    authorNameElement.textContent = project.profiles?.first_name || 'Usuario';
  }

  if (viewCountElement) {
    viewCountElement.textContent = project.cached_view_count || 0;
  }

  if (viewButton) {
    viewButton.setAttribute('data-project-slug', project.slug);
    viewButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar que el clic se propague al contenedor
      const slug = viewButton.getAttribute('data-project-slug');
      if (slug) {
        window.location.href = `/proyectos/${slug}`;
      }
    });
  }

  // Actualizar etiqueta de estado
  if (statusBadge) {
    statusBadge.textContent = getStatusText(project.status);
  }

  // Limpiar y agregar nuevo contenido
  bannerContent.innerHTML = '';
  bannerContent.appendChild(clone);
  
  // 🔥 NUEVO: Hacer todo el banner clickeable (excepto los controles de navegación)
  setupBannerClickHandler(bannerContent, project.slug);
  
  // Actualizar contadores
  updateBannerCounters();
}

// 🔥 NUEVA FUNCIÓN: Configurar clic en el contenedor del banner
function setupBannerClickHandler(bannerContent, projectSlug) {
  if (!bannerContent || !projectSlug) return;
  
  // Hacer el contenedor principal clickeable
  bannerContent.style.cursor = 'pointer';
  
  // Agregar event listener para el clic
  bannerContent.addEventListener('click', (e) => {
    // Verificar que el clic no sea en elementos que deben tener su propio comportamiento
    const isNavigationElement = e.target.closest('.banner-nav-side') || 
                               e.target.closest('.banner-nav-btn') ||
                               e.target.closest('.btn-banner-view') ||
                               e.target.closest('.banner-author') ||
                               e.target.closest('.banner-controls');
    
    if (!isNavigationElement) {
      // Navegar a los detalles del proyecto
      window.location.href = `/proyectos/${projectSlug}`;
    }
  });
  
  // Feedback visual al hover
  bannerContent.addEventListener('mouseenter', () => {
    bannerContent.style.opacity = '0.95';
  });
  
  bannerContent.addEventListener('mouseleave', () => {
    bannerContent.style.opacity = '1';
  });
}

// 🔥 FUNCIÓN: Actualizar contadores del banner
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

// 🔥 FUNCIÓN: Iniciar rotación automática del banner
function startBannerRotation() {
  if (popularProjects.length <= 1) return;
  
  if (bannerInterval) {
    clearInterval(bannerInterval);
  }
  
  bannerInterval = setInterval(() => {
    nextBannerProject();
  }, 8000);
}

// 🔥 FUNCIÓN: Siguiente proyecto en el banner
function nextBannerProject() {
  if (popularProjects.length === 0) return;
  
  currentBannerIndex = (currentBannerIndex + 1) % popularProjects.length;
  showBannerProject(currentBannerIndex);
}

// 🔥 FUNCIÓN: Proyecto anterior en el banner
function prevBannerProject() {
  if (popularProjects.length === 0) return;
  
  currentBannerIndex = (currentBannerIndex - 1 + popularProjects.length) % popularProjects.length;
  showBannerProject(currentBannerIndex);
}

// 🔥 FUNCIÓN: Ocultar banner
function hidePopularBanner() {
  const banner = document.getElementById('popular-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
  
  if (bannerInterval) {
    clearInterval(bannerInterval);
    bannerInterval = null;
  }
}

// 🔧 FUNCIÓN: Configurar event listeners (ACTUALIZADA CON BOTONES LATERALES)
function setupEventListeners() {
  // Botones de navegación laterales
  const prevSideBtn = document.querySelector('.banner-nav-side.prev');
  const nextSideBtn = document.querySelector('.banner-nav-side.next');
  
  if (prevSideBtn) {
    prevSideBtn.addEventListener('click', prevBannerProject);
  }
  
  if (nextSideBtn) {
    nextSideBtn.addEventListener('click', nextBannerProject);
  }
  
  // Botones originales (para móviles)
  const prevBtn = document.querySelector('.banner-nav-btn:first-child');
  const nextBtn = document.querySelector('.banner-nav-btn:last-child');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', prevBannerProject);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', nextBannerProject);
  }
  
  // Navegación entre secciones
  const sectionButtons = document.querySelectorAll('.categorias button');
  sectionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      sectionButtons.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      const section = e.target.getAttribute('data-section');
      
      if (section === 'proyectos') {
        loadPublicProjects();
      }
    });
  });
  
  // 🔍 Buscador
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      
      if (searchTerm) {
        toggleBannerVisibility(false);
      } else {
        toggleBannerVisibility(true);
      }
      
      loadPublicProjects(searchTerm);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        toggleBannerVisibility(true);
        loadPublicProjects('');
      }
    });
  }
}

// 🔥 FUNCIÓN PRINCIPAL: Cargar proyectos públicos
async function loadPublicProjects(searchTerm = '') {
  try {
    showLoading(true);
    
    // Controlar visibilidad del banner basado en búsqueda
    if (searchTerm && searchTerm.trim() !== '') {
      toggleBannerVisibility(false);
    } else {
      toggleBannerVisibility(true);
    }
    
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      console.error('❌ Supabase no está disponible');
      showError('Error de conexión con la base de datos. Recarga la página.');
      return;
    }

    let query = window.supabase
      .from('projects')
      .select('id, name, slug, title, subtitle, description, cover_image_url, status, category, technologies, visibility, created_at, created_by')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (searchTerm && searchTerm.trim() !== '') {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('❌ Error cargando proyectos:', error);
      showError('Error al cargar proyectos: ' + error.message);
      return;
    }

    const projectsWithUsers = await loadUsersForProjects(projects || []);
    const projectsByCategory = groupProjectsByCategory(projectsWithUsers);
    displayProjectsByCategory(projectsByCategory, searchTerm);

  } catch (error) {
    console.error('❌ Error cargando proyectos públicos:', error);
    showError('Error inesperado: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 🔥 FUNCIÓN: Cargar información de usuarios para los proyectos
async function loadUsersForProjects(projects) {
    if (!projects || projects.length === 0) return projects;

    try {
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
                users = userIds.map(id => ({
                    id: id,
                    username: 'usuario_' + id.substring(0, 8),
                    full_name: 'Usuario',
                    avatar_url: null
                }));
            }
        }

        if (users.length === 0) {
            users = userIds.map(id => ({
                id: id,
                username: 'usuario_' + id.substring(0, 8),
                full_name: 'Usuario',
                avatar_url: null
            }));
        }

        const usersMap = {};
        users.forEach(user => {
            const firstName = extractFirstName(user.full_name);
            usersMap[user.id] = {
                ...user,
                first_name: firstName
            };
        });

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

// 🔥 FUNCIÓN: Extraer primer nombre de full_name
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
                <div class="author-info clickable-author" data-username="${project.profiles?.username || ''}">
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
  connectProjectActions();
  
  if (window.updateTranslations) {
    setTimeout(() => window.updateTranslations(), 100);
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
    
    const authorElements = document.querySelectorAll('.clickable-author');
    authorElements.forEach(authorElement => {
        authorElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const username = authorElement.getAttribute('data-username');
            if (username && username !== 'Usuario') {
                navigateToProfile(username);
            } else {
                console.warn('Username no disponible para navegar al perfil');
            }
        });
        
        authorElement.style.cursor = 'pointer';
        authorElement.title = 'Ver perfil del usuario';
        
        authorElement.addEventListener('mouseenter', () => {
            authorElement.style.opacity = '0.8';
        });
        
        authorElement.addEventListener('mouseleave', () => {
            authorElement.style.opacity = '1';
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
window.toggleBannerVisibility = toggleBannerVisibility;
window.navigateToProfile = navigateToProfile;
window.startTypingAnimation = startTypingAnimation;

// Manejar errores no capturados
window.addEventListener('error', function(e) {
  console.error('❌ Error global:', e.error);
  if (window.universalSpinner) {
    universalSpinner.hide();
  }
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ Promesa no manejada:', e.reason);
  e.preventDefault();
});