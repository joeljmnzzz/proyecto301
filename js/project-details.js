// project-details.js - Carga dinámica de proyectos desde Supabase (VERSIÓN CORREGIDA)
class ProjectDetailsLoader {
    constructor() {
        this.projectSlug = this.getSlugFromURL();
        this.currentProject = null;
        this.userMap = null;
        this.init();
    }

    init() {
        // Esperar a que Supabase esté listo
        if (window.supabase) {
            this.loadProjectData();
        } else {
            window.addEventListener('supabase-ready', () => {
                this.loadProjectData();
            });
        }

        // Inicializar animación de la bola
        this.initBallScroll();
    }

    // Obtener el slug de la URL
    getSlugFromURL() {
        const path = window.location.pathname;
        const slug = path.split('/').pop();
        console.log('🔍 Slug detectado:', slug);
        return slug;
    }

    // Cargar datos del proyecto desde Supabase
    async loadProjectData() {
        try {
            // Mostrar spinner
            if (window.universalSpinner) {
                window.universalSpinner.show('Cargando proyecto...');
            }

            console.log('📡 Cargando proyecto con slug:', this.projectSlug);

            // ✅ CONSULTA CORREGIDA - Sin relaciones problemáticas
            const { data: project, error } = await window.supabase
                .from('projects')
                .select(`
                    *,
                    project_roles(*),
                    project_members(*),
                    project_desired_tech(*)
                `)
                .eq('slug', this.projectSlug)
                .eq('visibility', 'public')
                .single();

            if (error) {
                throw error;
            }

            if (!project) {
                throw new Error('Proyecto no encontrado');
            }

            this.currentProject = project;
            console.log('✅ Proyecto cargado:', project);

            // ✅ Cargar información de usuarios por separado si hay miembros
            if (project.project_members && project.project_members.length > 0) {
                await this.loadUsersInfo(project.project_members);
            }

            // Actualizar la interfaz
            this.updateUI();
            this.showContent();

        } catch (error) {
            console.error('❌ Error cargando proyecto:', error);
            this.showError();
        } finally {
            // Ocultar spinner
            if (window.universalSpinner) {
                window.universalSpinner.hide();
            }
        }
    }

    // ✅ NUEVO: Cargar información de usuarios desde la tabla correcta
    async loadUsersInfo(projectMembers) {
        if (!projectMembers || projectMembers.length === 0) return;

        try {
            const userIds = projectMembers.map(member => member.user_id).filter(id => id);
            
            if (userIds.length === 0) return;

            // Consultar información de usuarios desde la tabla 'profiles'
            const { data: users, error } = await window.supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (error) {
                console.warn('⚠️ No se pudieron cargar los usuarios:', error);
                return;
            }

            // Crear mapa de usuarios para acceso rápido
            this.userMap = {};
            if (users) {
                users.forEach(user => {
                    this.userMap[user.id] = user;
                });
            }

            console.log('✅ Usuarios cargados:', users);

        } catch (error) {
            console.warn('⚠️ Error cargando usuarios:', error);
        }
    }

    // Actualizar la interfaz con los datos del proyecto
    updateUI() {
        if (!this.currentProject) return;

        const project = this.currentProject;

        // Información básica - Solo mostrar si existe
        this.updateElementIfContent('project-title', project.title);
        this.updateElementIfContent('project-title-breadcrumb', project.title);
        this.updateElementIfContent('project-subtitle', project.subtitle);
        this.updateElementIfContent('project-description', project.description);
        this.updateElementIfContent('project-problem-solution', project.problem_solution);

        // Meta información
        this.updateElementIfContent('project-created-at', `Publicado: ${this.formatDate(project.created_at)}`, 'Fecha no disponible');
        this.updateElementIfContent('project-category', `Categoría: ${project.category}`, 'Sin categoría');
        this.updateElementIfContent('project-time-commitment', `Tiempo: ${this.formatTimeCommitment(project.time_commitment)}`, 'No especificado');
        this.updateElementIfContent('project-expertise-level', `Nivel: ${this.formatExpertiseLevel(project.expertise_level)}`, 'No especificado');

        // Estado del proyecto
        this.updateProjectStatus(project.status);

        // Imagen de portada
        this.updateCoverImage(project.cover_image_url);

        // Sidebar information
        this.updateElementIfContent('project-collaboration-mode', this.formatCollaborationMode(project.collaboration_mode), 'No especificado');
        this.updateElementIfContent('project-time-commitment-sidebar', this.formatTimeCommitment(project.time_commitment), 'No especificado');
        this.updateElementIfContent('project-expertise-level-sidebar', this.formatExpertiseLevel(project.expertise_level), 'No especificado');
        this.updateElementIfContent('project-license', project.license, 'No especificada');
        this.updateElementIfContent('project-needs-funding', project.needs_funding ? 'Sí requiere' : 'No requiere', 'No especificado');
        this.updateElementIfContent('project-visibility', this.formatVisibility(project.visibility), 'No especificada');

        // Elementos dinámicos - Solo mostrar si hay contenido
        this.updateTechnologies(project.technologies);
        this.updateDesiredTech(project.project_desired_tech);
        this.updateTags(project.tags);
        this.updateUSP(project.usp);
        this.updateRoles(project.project_roles);
        this.updateMembers(project.project_members);
        this.updateSocialLinks(project.social_links);
        this.updateActiveButtons(project.active_buttons);

        // Actualizar título de la página
        if (project.title) {
            document.title = `${project.title} | Proyecto 301`;
        }
    }

    // ✅ NUEVO: Helper para actualizar elementos solo si hay contenido
    updateElementIfContent(elementId, content, fallbackText = '') {
        const element = document.getElementById(elementId);
        if (element) {
            if (content) {
                element.textContent = content;
                element.style.display = ''; // Mostrar elemento
            } else {
                if (fallbackText) {
                    element.textContent = fallbackText;
                } else {
                    element.style.display = 'none'; // Ocultar elemento si no hay contenido
                }
            }
        }
    }

    // Helper para actualizar elementos del DOM
    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element && content) {
            element.textContent = content;
        }
    }

    // Formatear fecha
    formatDate(dateString) {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return null;
        }
    }

    // Formatear compromiso de tiempo
    formatTimeCommitment(timeCommitment) {
        if (!timeCommitment) return null;
        const translations = {
            'part-time': 'Tiempo parcial',
            'full-time': 'Tiempo completo',
            'freelance': 'Freelance'
        };
        return translations[timeCommitment] || timeCommitment;
    }

    // Formatear nivel de experiencia
    formatExpertiseLevel(level) {
        if (!level) return null;
        const translations = {
            'beginner': 'Principiante',
            'intermediate': 'Intermedio',
            'advanced': 'Avanzado'
        };
        return translations[level] || level;
    }

    // Formatear modo de colaboración
    formatCollaborationMode(mode) {
        if (!mode) return null;
        const translations = {
            'remote': 'Remoto',
            'hybrid': 'Híbrido',
            'in-person': 'Presencial'
        };
        return translations[mode] || mode;
    }

    // Formatear visibilidad
    formatVisibility(visibility) {
        if (!visibility) return null;
        const translations = {
            'public': 'Público',
            'private': 'Privado',
            'link-only': 'Solo con enlace'
        };
        return translations[visibility] || visibility;
    }

    // Actualizar estado del proyecto
    updateProjectStatus(status) {
        const statusElement = document.getElementById('project-status');
        if (!statusElement) return;

        const statusConfig = {
            'planning': { text: 'En Planificación', class: 'status-planning' },
            'development': { text: 'En Desarrollo', class: 'status-development' },
            'launched': { text: 'Lanzado', class: 'status-launched' }
        };

        const config = statusConfig[status] || { text: status || 'No especificado', class: 'status-planning' };
        statusElement.textContent = config.text;
        statusElement.className = `status-badge ${config.class}`;
    }


// Actualizar estado del proyecto
updateProjectStatus(status) {
    const statusElement = document.getElementById('project-status');
    if (!statusElement) return;

    const statusConfig = {
        'planning': { text: 'En Planificación', class: 'status-planning' },
        'development': { text: 'En Desarrollo', class: 'status-development' },
        'launched': { text: 'Lanzado', class: 'status-launched' }
    };

    const config = statusConfig[status] || { text: status || 'No especificado', class: 'status-planning' };
    statusElement.textContent = config.text;
    statusElement.className = `status-badge ${config.class}`;
} // ✅ Esta llave cierra updateProjectStatus


updateCoverImage(coverImageUrl) {
    const heroSection = document.querySelector('.project-hero');
    
    if (!heroSection) {
        console.log('❌ Hero section no encontrado');
        return;
    }

    console.log('🎨 Actualizando banner del hero con:', coverImageUrl);

    if (coverImageUrl && coverImageUrl.trim() !== '') {
        // ✅ Aplicar la imagen como fondo del hero
        const finalUrl = coverImageUrl + '?t=' + Date.now();
        
        heroSection.style.backgroundImage = `linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(58, 58, 58, 0.9) 100%), url('${finalUrl}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundBlendMode = 'overlay';
        
        console.log('✅ Banner del hero actualizado con imagen del proyecto');
        
    } else {
        // ✅ Usar gradiente por defecto si no hay imagen
        heroSection.style.backgroundImage = 'linear-gradient(135deg, #000000 0%, #3a3a3ae8 100%)';
        console.log('ℹ️ Usando gradiente por defecto (sin imagen)');
    }
} 

    // Actualizar tecnologías
    updateTechnologies(technologies) {
        const container = document.getElementById('project-technologies');
        if (!container) return;

        // Ocultar sección completa si no hay tecnologías
        const section = container.closest('.technologies-section');
        
        if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar tecnologías
        if (section) section.style.display = '';
        container.innerHTML = '';
        
        technologies.forEach(tech => {
            if (tech) {
                const techTag = document.createElement('span');
                techTag.className = 'tech-tag';
                techTag.textContent = tech;
                container.appendChild(techTag);
            }
        });
    }

    // Actualizar tecnologías deseadas
    updateDesiredTech(desiredTech) {
        const container = document.getElementById('project-desired-tech');
        if (!container) return;

        // Ocultar sección completa si no hay tecnologías deseadas
        const section = container.closest('.desired-tech-section');
        
        if (!desiredTech || desiredTech.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar tecnologías deseadas
        if (section) section.style.display = '';
        container.innerHTML = '';

        desiredTech.forEach(tech => {
            if (tech && tech.technology_name) {
                const item = document.createElement('div');
                item.className = 'tech-priority-item';
                
                const name = document.createElement('span');
                name.className = 'tech-name';
                name.textContent = tech.technology_name;
                
                const priority = document.createElement('span');
                priority.className = `priority-badge priority-${tech.priority || 'medium'}`;
                priority.textContent = this.formatPriority(tech.priority);
                
                item.appendChild(name);
                item.appendChild(priority);
                container.appendChild(item);
            }
        });
    }

    // Formatear prioridad
    formatPriority(priority) {
        const translations = {
            'high': 'Alta Prioridad',
            'medium': 'Media Prioridad',
            'low': 'Baja Prioridad'
        };
        return translations[priority] || 'Media Prioridad';
    }

    // Actualizar tags
    updateTags(tags) {
        const container = document.getElementById('project-tags');
        if (!container) return;

        // Ocultar sección completa si no hay tags
        const section = container.closest('.tags-section');
        
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar tags
        if (section) section.style.display = '';
        container.innerHTML = '';

        tags.forEach(tag => {
            if (tag) {
                const tagElement = document.createElement('span');
                tagElement.className = 'project-tag';
                tagElement.textContent = `#${tag}`;
                container.appendChild(tagElement);
            }
        });
    }

    // Actualizar USP (Unique Selling Propositions)
    updateUSP(usp) {
        const container = document.getElementById('project-usp');
        if (!container) return;

        // Ocultar sección completa si no hay USP
        const section = container.closest('.usp-section');
        
        if (!usp || !Array.isArray(usp) || usp.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar USP
        if (section) section.style.display = '';
        container.innerHTML = '';

        usp.forEach(item => {
            if (item && (item.title || item.description)) {
                const uspItem = document.createElement('div');
                uspItem.className = 'usp-item';
                
                uspItem.innerHTML = `
                    <i class="fas fa-check"></i>
                    <div>
                        <strong>${item.title || 'Característica'}</strong>
                        <p>${item.description || ''}</p>
                    </div>
                `;
                
                container.appendChild(uspItem);
            }
        });
    }

    // Actualizar roles
    updateRoles(roles) {
        const container = document.getElementById('project-roles');
        if (!container) return;

        // Ocultar sección completa si no hay roles
        const section = container.closest('.project-roles-section');
        
        if (!roles || roles.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar roles
        if (section) section.style.display = '';
        container.innerHTML = '';

        roles.forEach(role => {
            if (role && role.role_name) {
                const roleItem = document.createElement('div');
                roleItem.className = 'role-item';
                
                roleItem.innerHTML = `
                    <strong>${role.role_name}</strong>
                    <p>${role.description || 'Sin descripción adicional'}</p>
                `;
                
                container.appendChild(roleItem);
            }
        });
    }

    // Actualizar miembros
    updateMembers(members) {
        const container = document.getElementById('project-members');
        if (!container) return;

        // Ocultar sección completa si no hay miembros
        const section = container.closest('.team-section');
        
        if (!members || members.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        // Mostrar sección y llenar miembros
        if (section) section.style.display = '';
        container.innerHTML = '';

        members.forEach(member => {
            if (member) {
                const memberItem = document.createElement('div');
                memberItem.className = 'team-member';
                
                // ✅ Usar userMap si está disponible, sino datos básicos
                const user = this.userMap ? this.userMap[member.user_id] : null;
                const avatarUrl = user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                const userName = user?.user_name || `Usuario ${member.user_id?.substring(0, 8)}` || 'Usuario Anónimo';
                
                memberItem.innerHTML = `
                    <img src="${avatarUrl}" alt="${userName}" onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
                    <div>
                        <strong>${userName}</strong>
                        <span class="member-role">${this.formatMemberRole(member.role)}</span>
                        <span class="member-status ${member.is_active ? 'active' : 'inactive'}">
                            ${member.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                `;
                
                container.appendChild(memberItem);
            }
        });
    }

    // Formatear rol del miembro
    formatMemberRole(role) {
        if (!role) return 'Miembro';
        const translations = {
            'owner': 'Propietario',
            'admin': 'Administrador',
            'member': 'Miembro',
            'contributor': 'Colaborador'
        };
        return translations[role] || role;
    }

    // Actualizar enlaces sociales
    updateSocialLinks(socialLinks) {
        const container = document.getElementById('project-social-links');
        if (!container) return;

        // Ocultar sección completa si no hay enlaces sociales
        const parentCard = container.closest('.project-info-card');
        
        if (!socialLinks || Object.keys(socialLinks).length === 0) {
            if (parentCard) {
                const socialSection = container.parentElement;
                if (socialSection) socialSection.style.display = 'none';
            }
            return;
        }

        // Mostrar sección y llenar enlaces sociales
        if (parentCard) {
            const socialSection = container.parentElement;
            if (socialSection) socialSection.style.display = '';
        }
        
        container.innerHTML = '';

        const platforms = [
            { key: 'github', icon: 'fab fa-github', name: 'GitHub' },
            { key: 'website', icon: 'fas fa-globe', name: 'Sitio Web' },
            { key: 'linkedin', icon: 'fab fa-linkedin', name: 'LinkedIn' },
            { key: 'twitter', icon: 'fab fa-twitter', name: 'Twitter' },
            { key: 'discord', icon: 'fab fa-discord', name: 'Discord' }
        ];

        let hasLinks = false;
        
        platforms.forEach(platform => {
            if (socialLinks[platform.key]) {
                hasLinks = true;
                const link = document.createElement('a');
                link.href = socialLinks[platform.key];
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'social-link';
                link.innerHTML = `
                    <i class="${platform.icon}"></i>
                    ${platform.name}
                `;
                container.appendChild(link);
            }
        });

        // Si no hay enlaces después de procesar, ocultar
        if (!hasLinks && parentCard) {
            const socialSection = container.parentElement;
            if (socialSection) socialSection.style.display = 'none';
        }
    }

    // Actualizar botones activos
    updateActiveButtons(activeButtons) {
        const container = document.getElementById('project-active-buttons');
        if (!container) return;

        // Ocultar sección completa si no hay botones activos
        const parentCard = container.closest('.project-info-card');
        
        if (!activeButtons || !Array.isArray(activeButtons) || activeButtons.length === 0) {
            if (parentCard) {
                const actionsSection = container.parentElement;
                if (actionsSection) actionsSection.style.display = 'none';
            }
            return;
        }

        // Mostrar sección y llenar botones
        if (parentCard) {
            const actionsSection = container.parentElement;
            if (actionsSection) actionsSection.style.display = '';
        }
        
        container.innerHTML = '';

        const buttonsConfig = {
            'join-team': {
                text: 'Unirse al Equipo',
                icon: 'fas fa-users',
                class: 'btn-primary',
                action: 'join-team'
            },
            'contact-team': {
                text: 'Contactar al Equipo',
                icon: 'fas fa-envelope',
                class: 'btn-secondary',
                action: 'contact-team'
            },
            'view-demo': {
                text: 'Ver Demo',
                icon: 'fas fa-external-link-alt',
                class: 'btn-primary',
                action: 'view-demo'
            }
        };

        let hasButtons = false;

        activeButtons.forEach(buttonKey => {
            const config = buttonsConfig[buttonKey];
            if (config) {
                hasButtons = true;
                const button = document.createElement('button');
                button.className = `btn btn-action ${config.class}`;
                button.setAttribute('data-action', config.action);
                button.innerHTML = `
                    <i class="${config.icon}"></i>
                    ${config.text}
                `;
                
                button.addEventListener('click', () => {
                    this.handleButtonAction(config.action);
                });
                
                container.appendChild(button);
            }
        });

        // Si no hay botones después de procesar, ocultar
        if (!hasButtons && parentCard) {
            const actionsSection = container.parentElement;
            if (actionsSection) actionsSection.style.display = 'none';
        }
    }

    // Manejar acciones de botones
    handleButtonAction(action) {
        switch (action) {
            case 'join-team':
                this.joinTeam();
                break;
            case 'contact-team':
                this.contactTeam();
                break;
            case 'view-demo':
                this.viewDemo();
                break;
        }
    }

    joinTeam() {
        alert('Función: Unirse al equipo - Próximamente');
    }

    contactTeam() {
        alert('Función: Contactar al equipo - Próximamente');
    }

    viewDemo() {
        if (this.currentProject?.social_links?.website) {
            window.open(this.currentProject.social_links.website, '_blank');
        } else {
            alert('No hay demo disponible para este proyecto');
        }
    }

    // Mostrar contenido
    showContent() {
        const errorState = document.getElementById('error-state');
        const projectContent = document.getElementById('project-content');

        if (errorState) errorState.classList.add('hidden');
        if (projectContent) projectContent.classList.remove('hidden');
    }

    // Mostrar error
    showError() {
        const errorState = document.getElementById('error-state');
        const projectContent = document.getElementById('project-content');

        if (errorState) errorState.classList.remove('hidden');
        if (projectContent) projectContent.classList.add('hidden');
    }

    // Animación de la bola con scroll
    initBallScroll() {
        const ball = document.querySelector('.ball');
        if (!ball) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const moveDown = Math.min(scrollY * 0.3, 200);
            ball.style.transform = `translateY(${moveDown}px)`;
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ProjectDetailsLoader();
});