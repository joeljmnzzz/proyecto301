// project-details.js - Gestión de páginas individuales de proyectos

class ProjectDetails {
    constructor() {
        this.currentProject = null;
        this.isInitialized = false;
    }

    // 🔧 INICIALIZAR PÁGINA DE DETALLES
    async init() {
        if (this.isInitialized) return;

        console.log('🚀 Inicializando página de detalles del proyecto...');
        
        // Obtener slug de la URL
        const slug = this.getProjectSlugFromURL();
        
        if (!slug) {
            this.showError('URL de proyecto no válida');
            return;
        }

        await this.loadProjectDetails(slug);
        this.isInitialized = true;
    }

    // 🔍 OBTENER SLUG DE LA URL
    getProjectSlugFromURL() {
        const path = window.location.pathname;
        const match = path.match(/\/proyectos\/([^\/]+)/);
        
        if (match && match[1]) {
            console.log('📝 Slug detectado:', match[1]);
            return match[1];
        }
        
        console.error('❌ No se pudo extraer slug de la URL:', path);
        return null;
    }

    // 📥 CARGAR DETALLES DEL PROYECTO
    async loadProjectDetails(slug) {
        try {
            this.showLoading(true);
            
            if (!window.supabase) {
                throw new Error('Supabase no está disponible');
            }

            console.log('🔍 Cargando detalles del proyecto:', slug);

            // CONSULTA PARA OBTENER PROYECTO POR SLUG
            const { data: project, error } = await window.supabase
                .from('projects')
                .select(`
                    id, name, slug, title, subtitle, description, 
                    cover_image_url, status, category, technologies, 
                    visibility, created_at, created_by,
                    demo_url, repository_url, documentation_url,
                    featured, tags, long_description
                `)
                .eq('slug', slug)
                .eq('visibility', 'public')
                .single();

            if (error) {
                console.error('❌ Error cargando proyecto:', error);
                throw new Error('Proyecto no encontrado');
            }

            if (!project) {
                throw new Error('El proyecto no existe o no es público');
            }

            this.currentProject = project;
            await this.loadProjectAuthor(project.created_by);
            this.displayProjectDetails(project);

        } catch (error) {
            console.error('❌ Error cargando detalles:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 👤 CARGAR INFORMACIÓN DEL AUTOR
    async loadProjectAuthor(userId) {
        if (!userId) return;

        try {
            console.log('👤 Cargando información del autor:', userId);

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('username, full_name, avatar_url, bio, website')
                .eq('id', userId)
                .single();

            if (!error && profile) {
                this.currentProject.author = profile;
            } else {
                this.currentProject.author = {
                    username: 'usuario',
                    full_name: 'Usuario',
                    avatar_url: null
                };
            }
        } catch (error) {
            console.error('❌ Error cargando autor:', error);
            this.currentProject.author = {
                username: 'usuario',
                full_name: 'Usuario',
                avatar_url: null
            };
        }
    }

    // 🎨 MOSTRAR DETALLES DEL PROYECTO
    displayProjectDetails(project) {
        console.log('🎨 Mostrando detalles del proyecto:', project.title);

        // Actualizar título de la página
        document.title = `${project.title} - Mis Proyectos`;

        // Mostrar breadcrumb
        this.displayBreadcrumb(project);

        // Mostrar header del proyecto
        this.displayProjectHeader(project);

        // Mostrar contenido principal
        this.displayProjectContent(project);

        // Mostrar sidebar
        this.displayProjectSidebar(project);
    }

    // 📄 MOSTRAR HEADER DEL PROYECTO
    displayProjectHeader(project) {
        const headerElement = document.getElementById('project-header');
        if (!headerElement) return;

        headerElement.innerHTML = `
            <div class="project-cover-container">
                ${project.cover_image_url ? `
                    <img src="${project.cover_image_url}" alt="${project.title}" class="project-cover-image">
                ` : `
                    <div class="project-cover-placeholder">
                        <i class="fas fa-rocket"></i>
                    </div>
                `}
                <div class="project-header-content">
                    <div class="project-badge ${project.status}">
                        <i class="fas ${this.getStatusIcon(project.status)}"></i>
                        ${this.getStatusText(project.status)}
                    </div>
                    <h1 class="project-title">${project.title}</h1>
                    <p class="project-subtitle">${project.subtitle || ''}</p>
                    
                    <div class="project-author-info">
                        ${project.author?.avatar_url ? `
                            <img src="${project.author.avatar_url}" alt="${project.author.full_name}" class="author-avatar">
                        ` : `
                            <div class="author-avatar placeholder">
                                <i class="fas fa-user"></i>
                            </div>
                        `}
                        <span class="author-name">${project.author?.full_name || 'Usuario'}</span>
                        <span class="project-date">• ${this.formatDate(project.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 📝 MOSTRAR CONTENIDO PRINCIPAL
    displayProjectContent(project) {
        const contentElement = document.getElementById('project-content');
        if (!contentElement) return;

        contentElement.innerHTML = `
            <div class="project-description">
                <h2>Descripción del Proyecto</h2>
                <div class="description-content">
                    ${project.long_description || project.description || 'No hay descripción disponible.'}
                </div>
            </div>

            ${project.technologies && project.technologies.length > 0 ? `
                <div class="project-technologies">
                    <h3>Tecnologías Utilizadas</h3>
                    <div class="tech-tags">
                        ${project.technologies.map(tech => `
                            <span class="tech-tag">${tech}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="project-links">
                <h3>Enlaces del Proyecto</h3>
                <div class="links-grid">
                    ${project.demo_url ? `
                        <a href="${project.demo_url}" target="_blank" class="project-link demo">
                            <i class="fas fa-external-link-alt"></i>
                            <span>Ver Demo</span>
                        </a>
                    ` : ''}
                    
                    ${project.repository_url ? `
                        <a href="${project.repository_url}" target="_blank" class="project-link repository">
                            <i class="fab fa-github"></i>
                            <span>Código Fuente</span>
                        </a>
                    ` : ''}
                    
                    ${!project.demo_url && !project.repository_url ? `
                        <p class="no-links">No hay enlaces disponibles para este proyecto.</p>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 📊 MOSTRAR SIDEBAR
    displayProjectSidebar(project) {
        const sidebarElement = document.getElementById('project-sidebar');
        if (!sidebarElement) return;

        sidebarElement.innerHTML = `
            <div class="project-meta-card">
                <h3>Información del Proyecto</h3>
                
                <div class="meta-item">
                    <label><i class="fas fa-tag"></i> Categoría</label>
                    <span>${this.getCategoryDisplayName(project.category)}</span>
                </div>
                
                <div class="meta-item">
                    <label><i class="fas fa-eye"></i> Visibilidad</label>
                    <span class="visibility ${project.visibility}">
                        <i class="fas ${this.getVisibilityIcon(project.visibility)}"></i>
                        ${this.getVisibilityText(project.visibility)}
                    </span>
                </div>
                
                <div class="meta-item">
                    <label><i class="fas fa-calendar"></i> Creado</label>
                    <span>${this.formatDate(project.created_at)}</span>
                </div>
            </div>

            <div class="project-actions">
                <button class="btn btn-primary" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i>
                    Volver a Proyectos
                </button>
            </div>
        `;
    }

    // 🧭 MOSTRAR BREADCRUMB
    displayBreadcrumb(project) {
        const breadcrumbElement = document.getElementById('project-breadcrumb');
        if (!breadcrumbElement) return;

        breadcrumbElement.innerHTML = `
            <nav class="breadcrumb">
                <a href="/">Inicio</a>
                <i class="fas fa-chevron-right"></i>
                <a href="/">Proyectos</a>
                <i class="fas fa-chevron-right"></i>
                <span class="current">${project.title}</span>
            </nav>
        `;
    }

    // 🛠️ FUNCIONES AUXILIARES
    getStatusIcon(status) {
        const icons = {
            'planning': 'fa-lightbulb',
            'development': 'fa-code',
            'launched': 'fa-rocket',
            'completed': 'fa-check-circle',
            'paused': 'fa-pause-circle'
        };
        return icons[status] || 'fa-question';
    }

    getStatusText(status) {
        const texts = {
            'planning': 'En Planificación',
            'development': 'En Desarrollo',
            'launched': 'Lanzado',
            'completed': 'Completado',
            'paused': 'En Pausa'
        };
        return texts[status] || status;
    }

    getVisibilityIcon(visibility) {
        const icons = {
            'public': 'fa-globe-americas',
            'private': 'fa-lock',
            'link-only': 'fa-link',
            'draft': 'fa-eye-slash'
        };
        return icons[visibility] || 'fa-question';
    }

    getVisibilityText(visibility) {
        const texts = {
            'public': 'Público',
            'private': 'Privado',
            'link-only': 'Solo Enlace',
            'draft': 'Borrador'
        };
        return texts[visibility] || visibility;
    }

    getCategoryDisplayName(category) {
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ⏳ MOSTRAR/OCULTAR LOADING
    showLoading(show) {
        const loadingElement = document.getElementById('project-loading');
        const contentElement = document.getElementById('project-content');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        if (contentElement) {
            contentElement.style.display = show ? 'none' : 'block';
        }
    }

    // ❌ MOSTRAR ERROR
    showError(message) {
        const errorElement = document.getElementById('project-error');
        const contentElement = document.getElementById('project-content');
        
        if (errorElement) {
            errorElement.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar el proyecto</h3>
                    <p>${message}</p>
                    <button onclick="window.location.href='/'" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i>
                        Volver al Inicio
                    </button>
                </div>
            `;
            errorElement.style.display = 'block';
        }
        
        if (contentElement) {
            contentElement.style.display = 'none';
        }
        
        this.showLoading(false);
    }
}

// 🎯 INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    window.projectDetails = new ProjectDetails();
    window.projectDetails.init();
});