// dashboard.js - VERSIÓN COMPLETA CON CARGA DE PROYECTOS (SPINNER CORREGIDO)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando carga del dashboard...');
    
    // Mostrar spinner inmediatamente con traducción
    if (window.universalSpinner) {
        universalSpinner.show('spinner.loadingDashboard');
    }
    
    // Esperar a que las traducciones estén cargadas
    if (!window.translations) {
        console.log('🔄 Esperando traducciones...');
        setTimeout(() => {
            this.dispatchEvent(new Event('DOMContentLoaded'));
        }, 100);
        return;
    }
    
    try {
        await universalSpinner.withSpinner(loadUserName(), 'spinner.loadingUserInfo');
        await universalSpinner.withSpinner(loadUserProjects(), 'spinner.loadingProjects');
        await universalSpinner.withSpinner(loadDashboardData(), 'spinner.loadingDashboardData');
        
        // ✅ CORREGIDO: Cargar el modal y su script
        await loadCreateProjectModal(); 
        
        console.log('✅ Dashboard cargado completamente');
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        showNotification('Error al cargar el dashboard', 'error');
    }
});

// 🔥 NUEVA FUNCIÓN: Cargar proyectos del usuario
async function loadUserProjects() {
    try {
        console.log('📂 Cargando proyectos del usuario...');
        
        if (!window.supabase) {
            console.error('❌ Supabase no está inicializado');
            throw new Error('Supabase no disponible');
        }

        // Obtener el usuario actual
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Error obteniendo usuario:', userError);
            throw new Error('Usuario no autenticado');
        }

        // 🔥 CARGAR PROYECTOS DEL USUARIO
        const { data: projects, error: projectsError } = await window.supabase
            .from('projects')
            .select(`
                id,
                name,
                slug,
                title,
                subtitle,
                description,
                cover_image_url,
                status,
                category,
                technologies,
                created_at,
                visibility
            `)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (projectsError) {
            console.error('❌ Error cargando proyectos:', projectsError);
            throw projectsError;
        }

        console.log(`✅ ${projects?.length || 0} proyectos cargados:`, projects);
        
        // Actualizar la interfaz con los proyectos
        displayUserProjects(projects || []);
        
        // Actualizar métricas
        updateProjectsMetrics(projects?.length || 0);

    } catch (error) {
        console.error('❌ Error cargando proyectos del usuario:', error);
        displayProjectsError();
        throw error; // Re-lanzar el error para que withSpinner lo capture
    }
}

// 🔥 FUNCIÓN: Mostrar proyectos en la interfaz
function displayUserProjects(projects) {
    const projectsContainer = document.getElementById('user-projects');
    
    if (!projectsContainer) {
        console.error('❌ Contenedor de proyectos no encontrado');
        return;
    }

    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = `
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
        
        // Conectar el botón de crear primer proyecto
        setTimeout(() => {
            const createFirstBtn = document.getElementById('create-first-project');
            if (createFirstBtn) {
                createFirstBtn.addEventListener('click', () => {
                    const modal = document.getElementById('createProjectModal');
                    if (modal) {
                        modal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                });
            }
        }, 100);
        
        return;
    }

    // Generar HTML para cada proyecto
    const projectsHTML = projects.map(project => `
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
                <p class="project-subtitle">${project.subtitle || project.description?.substring(0, 100) || 'Sin descripción'}...</p>
                
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

    projectsContainer.innerHTML = projectsHTML;
    
    // Conectar eventos de los botones
    connectProjectActions();
    
    // Actualizar traducciones si es necesario
    if (window.updateTranslations) {
        setTimeout(() => window.updateTranslations(), 100);
    }
}

// 🔥 FUNCIÓN: Conectar acciones de los proyectos
function connectProjectActions() {
    // Botones de ver proyecto
    const viewButtons = document.querySelectorAll('.btn-view-project');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const slug = e.currentTarget.getAttribute('data-project-slug');
            if (slug) {
                // Mostrar spinner mientras navega
                if (window.universalSpinner) {
                    universalSpinner.show('spinner.loading');
                }
                window.location.href = `/proyectos/${slug}`;
            }
        });
    });
    
    // Botones de editar proyecto
    const editButtons = document.querySelectorAll('.btn-edit-project');
    editButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const projectId = e.currentTarget.getAttribute('data-project-id');
            console.log('Editar proyecto:', projectId);
            
            // Mostrar spinner mientras se carga la edición
            if (window.universalSpinner) {
                await universalSpinner.withSpinner(
                    new Promise(resolve => setTimeout(resolve, 1000)), // Simular carga
                    'spinner.loading'
                );
            }
            
            showNotification('Funcionalidad de edición en desarrollo', 'info');
        });
    });
}

// 🔥 FUNCIÓN: Mostrar error al cargar proyectos
function displayProjectsError() {
    const projectsContainer = document.getElementById('user-projects');
    if (projectsContainer) {
        projectsContainer.innerHTML = `
            <div class="projects-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 data-key="dashboard.projects.error">Error al cargar proyectos</h3>
                <p data-key="dashboard.projects.errorDescription">No se pudieron cargar tus proyectos. Intenta recargar la página.</p>
                <button class="btn-secondary" onclick="reloadWithSpinner()">
                    <i class="fas fa-redo"></i>
                    <span data-key="common.reload">Recargar</span>
                </button>
            </div>
        `;
    }
}

// 🔥 FUNCIÓN: Recargar con spinner
async function reloadWithSpinner() {
    if (window.universalSpinner) {
        await universalSpinner.withSpinner(
            new Promise(resolve => {
                setTimeout(() => {
                    location.reload();
                    resolve();
                }, 500);
            }),
            'spinner.loading'
        );
    } else {
        location.reload();
    }
}

// 🔥 FUNCIÓN: Actualizar métricas de proyectos
function updateProjectsMetrics(projectsCount) {
    const projectsCountElement = document.getElementById('projects-count');
    if (projectsCountElement) {
        projectsCountElement.textContent = projectsCount;
    }
    
    // También puedes actualizar otras métricas relacionadas
    const viewsCountElement = document.getElementById('views-count');
    if (viewsCountElement) {
        // Por ahora, un número placeholder - puedes implementar la lógica real después
        viewsCountElement.textContent = Math.floor(projectsCount * 12);
    }
}

// 🔥 FUNCIONES AUXILIARES
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

// 🔥 ACTUALIZAR: Función loadDashboardData para incluir más métricas
async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos del dashboard...');
        await simulateDataLoading();
        updateDashboardTexts();
        
        // Cargar métricas adicionales
        await loadAdditionalMetrics();
        
    } catch (error) {
        console.error('❌ Error cargando datos del dashboard:', error);
        throw error;
    }
}

// 🔥 NUEVA FUNCIÓN: Cargar métricas adicionales
async function loadAdditionalMetrics() {
    try {
        if (!window.supabase) return;
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;
        
        // Puedes agregar más consultas aquí para otras métricas
        // Por ejemplo: seguidores, colaboraciones, etc.
        
        updatePlaceholderMetrics();
        
    } catch (error) {
        console.error('Error cargando métricas adicionales:', error);
        throw error;
    }
}

function updatePlaceholderMetrics() {
    // Actualizar métricas con datos placeholder por ahora
    const followersElement = document.getElementById('followers-count');
    const collaborationsElement = document.getElementById('collaborations-count');
    const connectionsElement = document.getElementById('connections-count');
    
    if (followersElement) followersElement.textContent = '0';
    if (collaborationsElement) collaborationsElement.textContent = '0'; 
    if (connectionsElement) connectionsElement.textContent = '0';
}

// 🔥 FUNCIÓN PARA ACTUALIZAR PROYECTOS DESPUÉS DE CREAR UNO NUEVO
window.refreshUserProjects = async function() {
    console.log('🔄 Actualizando lista de proyectos...');
    try {
        await universalSpinner.withSpinner(loadUserProjects(), 'spinner.loadingProjects');
    } catch (error) {
        console.error('Error actualizando proyectos:', error);
        showNotification('Error al actualizar proyectos', 'error');
    }
};

// ✅ FUNCIÓN CORREGIDA: Cargar modal de creación de proyecto
async function loadCreateProjectModal() {
    try {
        console.log('🔄 Cargando modal de creación de proyecto...');
        
        const response = await fetch('../modals/create-project-modal.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const modalHTML = await response.text();
        const modalContainer = document.getElementById('modal-container');
        
        if (modalContainer) {
            modalContainer.innerHTML = modalHTML;
            console.log('✅ Modal HTML cargado correctamente');
            
            await loadCreateProjectModalScript();
            
        } else {
            console.error('❌ Contenedor del modal no encontrado');
        }
    } catch (error) {
        console.error('❌ Error cargando modal de creación:', error);
        showNotification('Error cargando modal de creación', 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Cargar el script del modal
async function loadCreateProjectModalScript() {
    return new Promise((resolve, reject) => {
        if (window.CreateProjectModal) {
            console.log('✅ CreateProjectModal ya está cargado');
            initCreateProjectModal();
            resolve();
            return;
        }
        
        console.log('📦 Cargando script create-project-modal.js...');
        const script = document.createElement('script');
        script.src = '../js/modals/create-project-modal.js';
        script.onload = () => {
            console.log('✅ create-project-modal.js cargado exitosamente');
            setTimeout(() => {
                if (window.CreateProjectModal) {
                    console.log('🎉 CreateProjectModal disponible');
                    initCreateProjectModal();
                    resolve();
                } else {
                    console.error('❌ CreateProjectModal no disponible después de cargar el script');
                    reject(new Error('CreateProjectModal no disponible después de cargar el script'));
                }
            }, 200);
        };
        script.onerror = () => {
            console.error('❌ Error cargando create-project-modal.js');
            reject(new Error('Error cargando el script del modal'));
        };
        
        document.head.appendChild(script);
    });
}

// ✅ FUNCIÓN CORREGIDA: Inicializar funcionalidad del modal
function initCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    
    if (!modal) {
        console.error('❌ Modal no encontrado en el DOM');
        return;
    }

    console.log('✅ Modal encontrado, inicializando CreateProjectModal...');
    
    if (window.CreateProjectModal) {
        try {
            window.createProjectModal = new CreateProjectModal();
            console.log('🎉 CreateProjectModal inicializado exitosamente');
            
            connectCreateProjectButton();
            
        } catch (error) {
            console.error('❌ Error al instanciar CreateProjectModal:', error);
        }
    } else {
        console.error('❌ Clase CreateProjectModal no disponible');
    }
}

// ✅ FUNCIÓN ACTUALIZADA: Conectar botón de crear proyecto
function connectCreateProjectButton() {
    const createBtn = document.getElementById('create-project-btn');
    const modal = document.getElementById('createProjectModal');
    
    console.log('🔍 Conectando botón de crear proyecto...');
    
    if (createBtn && modal) {
        const newCreateBtn = createBtn.cloneNode(true);
        createBtn.parentNode.replaceChild(newCreateBtn, createBtn);
        
        newCreateBtn.addEventListener('click', () => {
            console.log('🎯 Botón clickeado - Abriendo modal de creación de proyecto');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (window.createProjectModal) {
                console.log('✅ Modal inicializado correctamente');
                setTimeout(() => {
                    window.createProjectModal.updateNavigationButtons();
                }, 100);
            }
        });
        
        console.log('✅ Botón de crear proyecto CONECTADO EXITOSAMENTE');
    } else {
        console.error('❌ No se pudo conectar el botón');
        
        setTimeout(() => {
            console.log('🔄 Reintentando conectar botón...');
            connectCreateProjectButton();
        }, 1000);
    }
}

async function loadUserName() {
    try {
        if (!window.supabase) {
            console.error('❌ Supabase no está inicializado');
            throw new Error('Supabase no disponible');
        }

        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Error obteniendo usuario:', userError);
            throw new Error('Usuario no autenticado');
        }

        console.log('✅ Usuario encontrado:', user);

        let displayName = 'Usuario';
        let userProfession = '';
        let memberSince = new Date().getFullYear();
        
        if (user.user_metadata && user.user_metadata.full_name) {
            displayName = user.user_metadata.full_name;
            console.log('✅ Usando Display Name de user_metadata:', displayName);
        }
        else if (user.email) {
            displayName = user.email;
            console.log('ℹ️ Usando email como nombre:', displayName);
        }

        try {
            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('full_name, username, profession, created_at')
                .eq('id', user.id)
                .single();

            if (!profileError && profile) {
                const profileName = profile.full_name || profile.username;
                if (profileName && (displayName === 'Usuario' || displayName === user.email)) {
                    displayName = profileName;
                    console.log('✅ Usando nombre del perfil:', displayName);
                }
                
                if (profile.profession) {
                    userProfession = profile.profession;
                    console.log('✅ Profesión encontrada:', userProfession);
                }
                
                if (profile.created_at) {
                    memberSince = new Date(profile.created_at).getFullYear();
                    console.log('✅ Fecha de miembro encontrada:', memberSince);
                }
            }
        } catch (profileError) {
            console.log('ℹ️ No se pudo cargar perfil, usando datos de autenticación');
        }

        displayName = getFirstName(displayName);
        console.log('👤 Primer nombre extraído:', displayName);

        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = displayName;
            console.log('✅ Nombre actualizado en dashboard:', displayName);
        }

        updateUserProfessionAndDate(userProfession, memberSince);

    } catch (error) {
        console.error('❌ Error cargando nombre:', error);
        throw error;
    }
}

function updateUserProfessionAndDate(profession, memberSince) {
    const userRoleElement = document.getElementById('user-role');
    
    if (!userRoleElement) {
        console.warn('❌ Elemento user-role no encontrado');
        return;
    }

    const memberSinceElement = document.getElementById('member-since');
    if (memberSinceElement) {
        memberSinceElement.textContent = memberSince;
    }

    if (profession) {
        userRoleElement.innerHTML = `
            ${profession} • <span data-key="dashboard.userRole.memberSince">Miembro desde</span> 
            <span id="member-since">${memberSince}</span>
        `;
        console.log('✅ Profesión y fecha actualizadas:', profession, memberSince);
    } else {
        userRoleElement.innerHTML = `
            <span data-key="dashboard.userRole.default">Desarrollador Full-Stack • Miembro desde</span> 
            <span id="member-since">${memberSince}</span>
        `;
        console.log('ℹ️ Usando profesión por defecto');
    }
    
    if (window.updateTranslations) {
        window.updateTranslations();
    }
}

function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'Usuario';
    }
    
    if (fullName.includes('@')) {
        const emailPart = fullName.split('@')[0];
        return emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase();
    }
    
    const firstName = fullName.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

async function simulateDataLoading() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Datos del dashboard cargados');
            resolve();
        }, 1000);
    });
}

function updateDashboardTexts() {
    console.log('🔄 Actualizando textos del dashboard');
}

window.updateDashboardTexts = updateDashboardTexts;

// Manejar errores no capturados
window.addEventListener('error', function() {
    if (window.universalSpinner) {
        universalSpinner.hide();
    }
});

window.addEventListener('beforeunload', function() {
    if (window.universalSpinner) {
        universalSpinner.hide();
    }
});

// Función auxiliar para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Puedes usar tu sistema de notificaciones existente
    if (window.createProjectModal && window.createProjectModal.showNotification) {
        window.createProjectModal.showNotification(message, type);
    } else {
        // Fallback simple
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}