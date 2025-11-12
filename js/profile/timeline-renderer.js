// js/profile/timeline-renderer.js
class TimelineRenderer {
    constructor() {
        this.experiences = [];
        this._isOwnProfile = false; // 🔥 CAMBIO: Usar _isOwnProfile para evitar conflicto
        this.init();
    }

    init() {
        // Escuchar eventos de experiencias cargadas
        window.addEventListener('experiences-loaded', (e) => {
            this.experiences = e.detail.experiences;
            this.renderTimeline();
        });
        
        // 🔥 NUEVO: Escuchar cambios en el perfil
        window.addEventListener('profile-loaded', () => {
            this.updateProfileOwnership();
        });
        
        console.log('✅ TimelineRenderer inicializado');
    }

    // 🔥 NUEVO: Actualizar propiedad del perfil
    updateProfileOwnership() {
        if (window.profileManager) {
            this._isOwnProfile = window.profileManager.isOwnProfile;
            console.log('🔄 TimelineRenderer - Actualizado estado de propiedad:', this._isOwnProfile);
        } else if (window.experienceManager) {
            this._isOwnProfile = window.experienceManager.isOwnProfile;
        }
    }

    // 🔥 CORREGIDO: Método para verificar si es perfil propio
    isOwnProfile() {
        return this._isOwnProfile;
    }

    // Renderizar la línea de tiempo
    async renderTimeline() {
        const container = document.getElementById('experience-list');
        if (!container) {
            console.log('❌ Contenedor de experiencias no encontrado');
            return;
        }

        console.log('🎨 Renderizando timeline con:', this.experiences.length, 'experiencias');
        console.log('🔍 Es perfil propio?:', this.isOwnProfile()); // 🔥 CORREGIDO: usar método

        if (this.experiences.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        this.renderTimelineVertical(container);
    }

    // Renderizar estado vacío
    renderEmptyState(container) {
        // 🔥 CORREGIDO: Usar this.isOwnProfile() (método)
        const isOwn = this.isOwnProfile();
        
        console.log('🔍 TimelineRenderer - Renderizando empty state, es perfil propio?:', isOwn);
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <p>${isOwn ? 'Agrega tu primera experiencia profesional' : 'No hay experiencias mostradas'}</p>
                ${isOwn ? 
                    '<button class="btn-primary" id="add-first-experience" style="margin-top: 10px;">Agregar Experiencia</button>' : 
                    ''
                }
            </div>
        `;

        // Configurar botón de agregar primera experiencia
        const addButton = document.getElementById('add-first-experience');
        if (addButton && window.experienceManager) {
            addButton.addEventListener('click', () => {
                window.experienceManager.openExperienceModal();
            });
        }
    }

    // Resto del código permanece igual...
    renderTimelineVertical(container) {
        container.innerHTML = '';

        // Ordenar experiencias por fecha (más reciente primero)
        const sortedExperiences = [...this.experiences].sort((a, b) => 
            new Date(b.start_date) - new Date(a.start_date)
        );

        // Crear contenedor principal de timeline
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-vertical';

        sortedExperiences.forEach((experience, index) => {
            const timelineItem = this.createTimelineItem(experience, index, sortedExperiences.length);
            timelineContainer.appendChild(timelineItem);
        });

        container.appendChild(timelineContainer);
        console.log('✅ Timeline vertical renderizado con', sortedExperiences.length, 'experiencias');
    }

    // Crear elemento de timeline individual
    createTimelineItem(experience, index, totalItems) {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.setAttribute('data-experience-id', experience.id);

        const isFirst = index === 0;
        const isLast = index === totalItems - 1;

        timelineItem.innerHTML = `
            <div class="timeline-marker">
                <div class="timeline-dot ${experience.type}">
                    <i class="${this.getExperienceIcon(experience.type)}"></i>
                </div>
                ${!isLast ? '<div class="timeline-line"></div>' : ''}
            </div>
            <div class="timeline-content">
                ${this.renderTimelineContent(experience)}
            </div>
        `;

        return timelineItem;
    }

    // Renderizar contenido del timeline
    renderTimelineContent(experience) {
        const dateRange = this.formatDateRange(experience.start_date, experience.end_date, experience.current);
        const title = this.getExperienceTitle(experience);
        const subtitle = this.getExperienceSubtitle(experience);
        
        let contentHTML = `
            <div class="timeline-header">
                <h3 class="timeline-title">${title}</h3>
                <span class="timeline-date">${dateRange}</span>
            </div>
            <div class="timeline-subtitle">${subtitle}</div>
        `;

        // Modalidad (solo si existe)
        if (experience.modality) {
            contentHTML += `<div class="timeline-modality">${this.formatModality(experience.modality)}</div>`;
        }

        // Logros (solo si existe y no está vacío)
        if (experience.achievements && experience.achievements.trim()) {
            contentHTML += `
                <div class="timeline-achievements">
                    <div class="achievements-title">Logros y responsabilidades:</div>
                    <div class="achievements-content">${this.formatAchievements(experience.achievements)}</div>
                </div>
            `;
        }

        // Tecnologías (solo si existen)
        const technologiesHTML = this.renderTechnologies(experience.technologies);
        if (technologiesHTML) {
            contentHTML += technologiesHTML;
        }

        // Enlaces de proyectos (solo si existen)
        const projectLinksHTML = this.renderProjectLinks(experience.project_links);
        if (projectLinksHTML) {
            contentHTML += projectLinksHTML;
        }

        // URL del proyecto (solo para proyectos personales)
        if (experience.project_url && experience.type === 'personal') {
            contentHTML += `
                <div class="timeline-project-url">
                    <a href="${experience.project_url}" target="_blank" class="project-link">
                        <i class="fas fa-external-link-alt"></i> Ver proyecto
                    </a>
                </div>
            `;
        }

        // URL del certificado (solo para educación)
        if (experience.certificate_url && experience.type === 'education') {
            contentHTML += `
                <div class="timeline-certificate-url">
                    <a href="${experience.certificate_url}" target="_blank" class="certificate-link">
                        <i class="fas fa-certificate"></i> Ver certificado
                    </a>
                </div>
            `;
        }

        // Acciones (solo para perfil propio)
        if (this.isOwnProfile()) { // 🔥 CORREGIDO: usar método
            contentHTML += this.renderExperienceActions(experience.id);
        }

        return contentHTML;
    }

    // Resto de métodos helper permanecen igual...
    getExperienceIcon(type) {
        const icons = {
            'work': 'fas fa-building',
            'freelance': 'fas fa-laptop-code',
            'personal': 'fas fa-rocket',
            'volunteer': 'fas fa-hands-helping',
            'education': 'fas fa-graduation-cap'
        };
        return icons[type] || 'fas fa-briefcase';
    }

    formatDateRange(startDate, endDate, isCurrent = false) {
        const start = this.formatDate(startDate);
        const end = isCurrent ? 'Presente' : (endDate ? this.formatDate(endDate) : 'Fecha no especificada');
        return `${start} - ${end}`;
    }

    formatDate(dateString) {
        if (!dateString) return 'Fecha no especificada';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short'
            });
        } catch (error) {
            return dateString;
        }
    }

    getExperienceTitle(experience) {
        switch (experience.type) {
            case 'work':
                return experience.title || 'Puesto no especificado';
            case 'freelance':
                return experience.role || 'Rol no especificado';
            case 'personal':
                return experience.project_name || 'Proyecto personal';
            case 'volunteer':
                return experience.role || 'Voluntario';
            case 'education':
                return experience.course_name || 'Curso/Certificación';
            default:
                return 'Experiencia';
        }
    }

    getExperienceSubtitle(experience) {
        switch (experience.type) {
            case 'work':
                return experience.company || 'Empresa no especificada';
            case 'freelance':
                return experience.client ? `Cliente: ${experience.client}` : 'Proyecto freelance';
            case 'personal':
                return 'Proyecto Personal';
            case 'volunteer':
                return experience.organization || 'Organización';
            case 'education':
                return experience.institution || 'Institución educativa';
            default:
                return '';
        }
    }

    formatModality(modality) {
        const modalities = {
            'remote': '🌐 Remoto',
            'hybrid': '⚡ Híbrido',
            'in-person': '🏢 Presencial'
        };
        return modalities[modality] || modality;
    }

    formatAchievements(achievements) {
        if (!achievements) return '';
        return achievements.replace(/\n/g, '<br>');
    }

    renderTechnologies(technologies) {
        if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
            return '';
        }

        const techTags = technologies.map(tech => 
            `<span class="tech-tag">${tech}</span>`
        ).join('');

        return `
            <div class="timeline-technologies">
                <div class="tech-tags">${techTags}</div>
            </div>
        `;
    }

    renderProjectLinks(projectLinks) {
        if (!projectLinks || !Array.isArray(projectLinks) || projectLinks.length === 0) {
            return '';
        }

        const links = projectLinks.map(link => 
            `<a href="${link}" target="_blank" class="project-link" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i> ${this.getDomainFromUrl(link)}
            </a>`
        ).join('');

        return `
            <div class="timeline-links">
                <div class="links-title">Enlaces relacionados:</div>
                <div class="links-list">${links}</div>
            </div>
        `;
    }

    getDomainFromUrl(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain.length > 30 ? domain.substring(0, 30) + '...' : domain;
        } catch {
            return 'Ver enlace';
        }
    }

    renderExperienceActions(experienceId) {
        return `
            <div class="timeline-actions">
                <button class="btn-edit-experience" data-experience-id="${experienceId}" title="Editar experiencia">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete-experience" data-experience-id="${experienceId}" title="Eliminar experiencia">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
    }

    // Configurar event listeners para acciones
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Editar experiencia
            if (e.target.closest('.btn-edit-experience')) {
                const experienceId = e.target.closest('.btn-edit-experience').dataset.experienceId;
                this.editExperience(experienceId);
            }
            
            // Eliminar experiencia
            if (e.target.closest('.btn-delete-experience')) {
                const experienceId = e.target.closest('.btn-delete-experience').dataset.experienceId;
                this.deleteExperience(experienceId);
            }
        });
    }

    // Editar experiencia
    editExperience(experienceId) {
        const experience = this.experiences.find(exp => exp.id === experienceId);
        if (experience && window.experienceManager) {
            window.experienceManager.openExperienceModal(experience);
        }
    }

    // Eliminar experiencia
    async deleteExperience(experienceId) {
        if (window.experienceManager) {
            await window.experienceManager.deleteExperience(experienceId);
        }
    }
}

// Inicializar automáticamente
let timelineRenderer;

document.addEventListener('DOMContentLoaded', () => {
    timelineRenderer = new TimelineRenderer();
    window.timelineRenderer = timelineRenderer;
    
    // Configurar event listeners después de un breve delay
    setTimeout(() => {
        timelineRenderer.setupEventListeners();
    }, 1000);
    
    console.log('🚀 TimelineRenderer listo');
});

// Exportar para uso global
window.TimelineRenderer = TimelineRenderer;