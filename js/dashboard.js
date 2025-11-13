// dashboard.js - VERSIÓN LIMPIA SOLO PARA MOSTRAR CONTADORES
document.addEventListener('DOMContentLoaded', async function() {
    
    if (window.universalSpinner) {
        universalSpinner.show('spinner.loadingDashboard');
    }
    
    try {
        await loadCriticalData();
        loadNonCriticalData();
        
    } catch (error) {
        console.error('❌ Error crítico en dashboard:', error);
        showNotification('Error al cargar el dashboard', 'error');
    } finally {
        setTimeout(() => {
            if (window.universalSpinner) {
                universalSpinner.hide();
            }
        }, 300);
    }
});

// ✅ DATOS CRÍTICOS
async function loadCriticalData() {
    
    if (!window.supabase) {
        throw new Error('Supabase no disponible');
    }

    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuario no autenticado');

    const [userBasicInfo, projects] = await Promise.all([
        getUserBasicInfo(user.id),
        getUserProjectsBasic(user.id)
    ]);

    renderCriticalUI(userBasicInfo, projects);
}

// ✅ DATOS NO CRÍTICOS
function loadNonCriticalData() {
    Promise.allSettled([
        loadAdditionalMetrics(),
        loadCreateProjectModalAsync(),
        loadUserDetailedProfile()
    ]).then(results => {
        updateNonCriticalUI();
    }).catch(error => {
        console.warn('⚠️ Algunos datos no críticos fallaron:', error);
    });
}

// ✅ FUNCIÓN OPTIMIZADA: Información básica del usuario
async function getUserBasicInfo(userId) {
    try {
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('full_name, username, profession, created_at')
            .eq('id', userId)
            .single();

        if (error) {
            return getFallbackUserInfo();
        }

        return {
            displayName: getDisplayName(profile),
            profession: profile.profession || 'Desarrollador Full-Stack',
            memberSince: new Date(profile.created_at).getFullYear() || new Date().getFullYear()
        };
    } catch (error) {
        console.warn('⚠️ Error cargando info usuario:', error);
        return getFallbackUserInfo();
    }
}

// ✅ FUNCIÓN OPTIMIZADA: Proyectos básicos CON VISTAS (SOLO LECTURA)
async function getUserProjectsBasic(userId) {
    try {
        const { data: projects, error } = await window.supabase
            .from('projects')
            .select(`
                id, name, slug, title, subtitle, 
                cover_image_url, status, category, technologies,
                visibility, created_at, 
                cached_view_count, cached_unique_views
            `)
            .eq('created_by', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('❌ Error cargando proyectos:', error);
            return [];
        }

        return projects || [];
    } catch (error) {
        console.error('❌ Error en carga de proyectos:', error);
        return [];
    }
}

// ✅ RENDERIZADO CRÍTICO: Mostrar UI inmediatamente
function renderCriticalUI(userInfo, projects) {
    updateUserHeader(userInfo);
    renderProjectsSection(projects);
    updateBasicMetrics(projects.length);
}

// ✅ ACTUALIZAR CABECERA DEL USUARIO
function updateUserHeader(userInfo) {
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    
    if (userNameElement) {
        userNameElement.textContent = userInfo.displayName;
    }
    
    if (userRoleElement) {
        userRoleElement.innerHTML = `
            ${userInfo.profession} • 
            <span data-key="dashboard.userRole.memberSince">Miembro desde</span> 
            <span id="member-since">${userInfo.memberSince}</span>
        `;
    }
    
    if (window.updateTranslations) {
        setTimeout(() => window.updateTranslations(), 50);
    }
}

// ✅ RENDERIZAR SECCIÓN DE PROYECTOS
function renderProjectsSection(projects) {
    const projectsContainer = document.getElementById('user-projects');
    
    if (!projectsContainer) {
        console.error('❌ Contenedor de proyectos no encontrado');
        return;
    }

    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = getNoProjectsHTML();
        setupNoProjectsButton();
        return;
    }

    projectsContainer.innerHTML = generateProjectsHTML(projects);
    connectProjectActions();
}

// ✅ GENERAR HTML DE PROYECTOS (SOLO MUESTRA CONTADORES)
function generateProjectsHTML(projects) {
    return projects.map(project => `
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
                
                <!-- ✅ SOLO MUESTRA CONTADOR - NO REGISTRA VISTAS -->
                <div class="project-views-overlay">
                    <i class="fas fa-eye"></i>
                    <span>${project.cached_view_count || 0}</span>
                </div>
            </div>
            
            <div class="project-card-content">
                <p class="project-subtitle">${getProjectSubtitle(project)}</p>
                
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
                
                <!-- ✅ MÉTRICAS DE VISTAS (SOLO LECTURA) -->
                <div class="project-view-metrics">
                    <div class="view-metric">
                        <span class="metric-value">${project.cached_view_count || 0}</span>
                        <span class="metric-label">Vistas totales</span>
                    </div>
                    <div class="view-metric">
                        <span class="metric-value">${project.cached_unique_views || 0}</span>
                        <span class="metric-label">Visitantes únicos</span>
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
                        <span data-key="dashboard.projects.view">Ver</span>
                    </button>
                    <button class="btn-edit-project" data-project-id="${project.id}">
                        <i class="fas fa-edit"></i>
                        <span data-key="dashboard.projects.edit">Editar</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ✅ CONECTAR ACCIONES DE PROYECTOS (SIMPLIFICADO)
function connectProjectActions() {
    document.querySelectorAll('.btn-view-project').forEach(button => {
        button.addEventListener('click', (e) => {
            const slug = e.currentTarget.getAttribute('data-project-slug');
            if (slug) {
                navigateToProject(slug);
            }
        });
    });
    
    document.querySelectorAll('.btn-edit-project').forEach(button => {
        button.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-project-id');
            handleEditProject(projectId);
        });
    });
}

// ✅ FUNCIONES AUXILIARES BÁSICAS
function getDisplayName(profile) {
    if (!profile) return 'Usuario';
    const rawName = profile.full_name || profile.username;
    if (!rawName) return 'Usuario';
    
    if (rawName.includes('@')) {
        const emailPart = rawName.split('@')[0];
        return emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase();
    }
    
    const firstName = rawName.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

function getFallbackUserInfo() {
    return {
        displayName: 'Usuario',
        profession: 'Sin profesión especificada',
        memberSince: new Date().getFullYear()
    };
}

function getProjectSubtitle(project) {
    const subtitle = project.subtitle || project.description || '';
    return subtitle.substring(0, 100) + (subtitle.length > 100 ? '...' : '');
}

function getStatusIcon(status) {
    const icons = {
        'planning': 'fa-lightbulb',
        'development': 'fa-code',
        'launched': 'fa-rocket'
    };
    return icons[status] || 'fa-question';
}

function getStatusText(status) {
    const texts = {
        'planning': 'En Idea',
        'development': 'En Desarrollo', 
        'launched': 'Lanzado'
    };
    return texts[status] || status;
}

function getVisibilityIcon(visibility) {
    const icons = {
        'public': 'fa-globe',
        'link-only': 'fa-link',
        'private': 'fa-lock'
    };
    return icons[visibility] || 'fa-question';
}

function getVisibilityText(visibility) {
    const texts = {
        'public': 'Público',
        'link-only': 'Solo Enlace',
        'private': 'Privado'
    };
    return texts[visibility] || visibility;
}

function getNoProjectsHTML() {
    return `
        <div class="no-projects">
            <div class="no-projects-icon">
                <i class="fas fa-rocket"></i>
            </div>
            <h3 data-key="dashboard.projects.noProjects">No tienes proyectos aún</h3>
            <p data-key="dashboard.projects.createFirst">Crea tu primer proyecto para comenzar tu viaje</p>
            <button class="btn-primary" id="create-first-project">
                <i class="fas fa-plus"></i> 
                <span data-key="dashboard.projects.newProject">Crear Primer Proyecto</span>
            </button>
        </div>
    `;
}

function setupNoProjectsButton() {
    setTimeout(() => {
        const createFirstBtn = document.getElementById('create-first-project');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => {
                openCreateProjectModal();
            });
        }
    }, 100);
}

// ✅ MÉTRICAS BÁSICAS
function updateBasicMetrics(projectsCount) {
    const projectsCountElement = document.getElementById('projects-count');
    if (projectsCountElement) {
        projectsCountElement.textContent = projectsCount;
    }
    
    const viewsCountElement = document.getElementById('views-count');
    if (viewsCountElement) {
        viewsCountElement.textContent = '0'; // Placeholder simple
    }
}

// ✅ NAVEGACIÓN Y ACCIONES BÁSICAS
function navigateToProject(slug) {
    if (window.universalSpinner) {
        universalSpinner.show('spinner.loading');
    }
    window.location.href = `/proyectos/${slug}`;
}

async function handleEditProject(projectId) {
    showNotification('Funcionalidad de edición en desarrollo', 'info');
}

function openCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        loadCreateProjectModalAsync().then(() => {
            const modal = document.getElementById('createProjectModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
}

// ✅ CARGA DE MÓDAL (NO CRÍTICO)
async function loadCreateProjectModalAsync() {
    if (document.getElementById('createProjectModal')) return;

    try {
        const response = await fetch('../modals/create-project-modal.html');
        if (!response.ok) throw new Error('Error cargando modal');
        
        const modalHTML = await response.text();
        const modalContainer = document.getElementById('modal-container');
        
        if (modalContainer) {
            modalContainer.innerHTML = modalHTML;
            await loadModalScript();
        }
    } catch (error) {
        console.warn('⚠️ Modal no cargado:', error);
    }
}

async function loadModalScript() {
    return new Promise((resolve) => {
        if (window.CreateProjectModal) {
            initCreateProjectModal();
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '../js/modals/create-project-modal.js';
        script.onload = () => {
            setTimeout(() => {
                if (window.CreateProjectModal) {
                    initCreateProjectModal();
                }
                resolve();
            }, 100);
        };
        script.onerror = resolve;
        document.head.appendChild(script);
    });
}

function initCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    if (modal && window.CreateProjectModal) {
        try {
            window.createProjectModal = new CreateProjectModal();
            connectCreateProjectButton();
        } catch (error) {
            console.warn('⚠️ Error inicializando modal:', error);
        }
    }
}

function connectCreateProjectButton() {
    const createBtn = document.getElementById('create-project-btn');
    const modal = document.getElementById('createProjectModal');
    
    if (createBtn && modal) {
        const newCreateBtn = createBtn.cloneNode(true);
        createBtn.parentNode.replaceChild(newCreateBtn, createBtn);
        
        newCreateBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
}

// ✅ FUNCIONES RESTANTES (SIMPLIFICADAS)
async function loadAdditionalMetrics() {
    // Métricas adicionales básicas
}

async function loadUserDetailedProfile() {
    // Perfil detallado
}

function updateDetailedMetrics() {
    const followersElement = document.getElementById('followers-count');
    const collaborationsElement = document.getElementById('collaborations-count');
    const connectionsElement = document.getElementById('connections-count');
    
    if (followersElement) followersElement.textContent = '0';
    if (collaborationsElement) collaborationsElement.textContent = '0'; 
    if (connectionsElement) connectionsElement.textContent = '0';
}

function updateNonCriticalUI() {
    // Actualizaciones no críticas
}

// ✅ FUNCIONES GLOBALES
window.refreshUserProjects = async function() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
            const projects = await getUserProjectsBasic(user.id);
            renderProjectsSection(projects);
            updateBasicMetrics(projects.length);
        }
    } catch (error) {
        console.error('Error actualizando proyectos:', error);
        showNotification('Error al actualizar proyectos', 'error');
    }
};

// ✅ MANEJO DE ERRORES
function showNotification(message, type = 'info') {
    if (window.createProjectModal && window.createProjectModal.showNotification) {
        window.createProjectModal.showNotification(message, type);
    } else {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// ✅ EVENTOS GLOBALES
window.addEventListener('error', function() {
    if (window.universalSpinner) universalSpinner.hide();
});

window.addEventListener('beforeunload', function() {
    if (window.universalSpinner) universalSpinner.hide();
});