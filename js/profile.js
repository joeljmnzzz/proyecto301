// profile.js - Gestión de perfiles de usuario
class ProfileManager {
    constructor() {
        this.currentProfileId = this.getProfileIdFromURL();
        this.currentUserId = null;
        this.isOwnProfile = false;
        this.profileData = null;
        this.init();
    }

        async init() {
            try {
                // Esperar a que Supabase esté listo
                if (!window.supabase) {
                    window.addEventListener('supabase-ready', () => this.loadProfile());
                    return;
                }
                
                // 🔥 DEBUG TEMPORAL
                this.debugProfileLoading();
                
                await this.loadProfile();
                this.setupEventListeners();
                
            } catch (error) {
                console.error('Error inicializando ProfileManager:', error);
                this.showError();
            }
        }

    // Obtener ID del perfil desde la URL
    // Obtener ID del perfil desde la URL
getProfileIdFromURL() {
    const path = window.location.pathname;
    console.log('🔍 URL completa:', path);
    
    const segments = path.split('/').filter(segment => segment !== '');
    console.log('🔍 Segmentos de URL:', segments);
    
    // Buscar el segmento "perfiles" en la URL
    const perfilesIndex = segments.indexOf('perfiles');
    
    if (perfilesIndex !== -1 && segments[perfilesIndex + 1]) {
        const profileIdentifier = segments[perfilesIndex + 1];
        console.log('✅ Identificador de perfil encontrado:', profileIdentifier);
        return profileIdentifier;
    }
    
    // Si no hay ID en la URL, será el perfil del usuario actual
    console.log('ℹ️ No se encontró identificador en URL, será perfil actual');
    return null;
}

    // Cargar perfil
    async loadProfile() {
        try {
            if (window.universalSpinner) {
                window.universalSpinner.show('Cargando perfil...');
            }

            // Obtener usuario actual
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;

            this.currentUserId = user?.id || null;

            // Determinar qué perfil cargar
            const profileIdToLoad = this.currentProfileId || this.currentUserId;
            
            if (!profileIdToLoad) {
                throw new Error('No se pudo determinar el perfil a cargar');
            }

            // Verificar si es el perfil propio
            this.isOwnProfile = profileIdToLoad === this.currentUserId;

            // Cargar datos del perfil
            await this.loadProfileData(profileIdToLoad);
            
            // Cargar datos adicionales
            await this.loadAdditionalData(profileIdToLoad);

            await this.updateUI();
            this.setupProfileVisibility();

        } catch (error) {
            console.error('Error cargando perfil:', error);
            this.showError();
        } finally {
            if (window.universalSpinner) {
                window.universalSpinner.hide();
            }
        }
    }

// Cargar datos básicos del perfil
async loadProfileData(profileIdentifier) {
    console.log('🔍 Buscando perfil con identificador:', profileIdentifier);
    console.log('🔍 Tipo de identificador:', typeof profileIdentifier);
    
    // 🔥 DETECCIÓN MEJORADA - Verificar si es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(profileIdentifier);
    
    console.log('🔍 ¿Es UUID?:', isUUID);
    console.log('🔍 Longitud del identificador:', profileIdentifier.length);
    
    let profile = null;
    let error = null;

    if (isUUID) {
        // 🔥 BUSCAR SOLO POR ID si es un UUID válido
        console.log('🔍 Buscando por UUID...');
        ({ data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', profileIdentifier)
            .single());
            
        if (error && error.code === 'PGRST116') {
            console.log('🔍 No encontrado por UUID, intentando por username...');
            // Si no se encuentra por UUID, intentar por username
            ({ data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('username', profileIdentifier)
                .single());
        }
    } else {
        // 🔥 BUSCAR SOLO POR USERNAME si no es UUID
        console.log('🔍 Buscando por username...');
        ({ data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('username', profileIdentifier)
            .single());
            
        if (error && error.code === 'PGRST116') {
            console.log('🔍 No encontrado por username, intentando por UUID...');
            // Si no se encuentra por username, intentar por UUID
            ({ data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', profileIdentifier)
                .single());
        }
    }

    if (error) {
        // Si no existe el perfil, mostrar error
        if (error.code === 'PGRST116') {
            console.error('❌ Perfil no encontrado:', profileIdentifier);
            this.showProfileNotFound();
            return;
        }
        console.error('❌ Error cargando perfil:', error);
        throw error;
    }

    this.profileData = profile;
    console.log('✅ Perfil cargado exitosamente:', profile);
}

// 🔥 FUNCIÓN DE DEBUG TEMPORAL
debugProfileLoading() {
    console.log('=== DEBUG PROFILE LOADING ===');
    console.log('URL completa:', window.location.href);
    console.log('ProfileIdentifier:', this.currentProfileId);
    console.log('Es UUID?:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.currentProfileId));
    
    // Verificar si el username existe en la base de datos
    if (this.currentProfileId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.currentProfileId)) {
        console.log('🔍 Verificando si el username existe en DB...');
        window.supabase
            .from('profiles')
            .select('username')
            .eq('username', this.currentProfileId)
            .then(({ data, error }) => {
                console.log('Resultado búsqueda por username:', data);
                console.log('Error búsqueda por username:', error);
            });
    }
}

// Nueva función para mostrar error de perfil no encontrado
showProfileNotFound() {
    const main = document.querySelector('.profile-main');
    if (main) {
        main.innerHTML = `
            <div class="error-state">
                <i class="fas fa-user-slash"></i>
                <h3>Perfil no encontrado</h3>
                <p>El perfil que buscas no existe o ha sido eliminado.</p>
                <a href="../index.html" class="btn-primary">Volver al Inicio</a>
            </div>
        `;
    }
}
    // Crear perfil básico si no existe
    async createBasicProfile(userId) {
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        if (userError) throw userError;

        const { error } = await window.supabase
            .from('profiles')
            .insert({
                id: userId,
                username: user.email.split('@')[0],
                full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                profession: 'Desarrollador',
                bio: '¡Hola! Soy nuevo en Proyecto 301.',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('✅ Perfil básico creado');
    }

    // Cargar datos adicionales
    async loadAdditionalData(profileId) {
        await Promise.all([
            this.loadUserProjects(profileId),
            this.loadUserStats(profileId),
            this.loadSocialStats(profileId)
        ]);
    }

    // Cargar proyectos del usuario
    async loadUserProjects(userId) {
        const { data: projects, error } = await window.supabase
            .from('projects')
            .select('id, title, subtitle, cover_image_url, status, created_at, slug')
            .eq('created_by', userId)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) {
            console.warn('Error cargando proyectos:', error);
            this.userProjects = [];
            return;
        }

        this.userProjects = projects || [];
    }

    // Cargar estadísticas del usuario
    async loadUserStats(userId) {
        // Contar proyectos
        const { count: projectsCount, error: projectsError } = await window.supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', userId)
            .eq('visibility', 'public');

        // Estadísticas de seguidores (placeholder por ahora)
        const followersCount = 0;
        const followingCount = 0;

        this.userStats = {
            projects: projectsError ? 0 : (projectsCount || 0),
            followers: followersCount,
            following: followingCount
        };
    }

    // Cargar estadísticas sociales (placeholder)
    async loadSocialStats(userId) {
        // Por implementar cuando tengamos las tablas de likes/comentarios
        this.socialStats = {
            likes: 0,
            comments: 0,
            shares: 0
        };
    }

    // Actualizar la interfaz
    async updateUI() {
        if (!this.profileData) return;

        this.updateBasicInfo();
        await this.updateAboutSection();
        this.updateSkillsSection();
        this.updateProjectsSection();
        this.updateSocialStats();
        this.updateActionButtons();
        
        // Actualizar título de la página
        document.title = `${this.profileData.full_name || this.profileData.username} - Proyecto 301`;
    }

    // Actualizar información básica
    updateBasicInfo() {
        this.updateElement('profile-name', this.profileData.full_name || this.profileData.username || 'Usuario');
        this.updateElement('profile-profession', this.profileData.profession || 'Desarrollador');
        this.updateElement('profile-location', this.profileData.location || 'No especificado');
        
        // Avatar
        const avatar = document.getElementById('profile-avatar');
        if (avatar) {
            avatar.src = this.profileData.avatar_url || 
                        '../assets/elements/default-avatar.png';
            avatar.alt = this.profileData.full_name || 'Avatar';
        }

        // Estadísticas
        this.updateElement('projects-count', this.userStats?.projects || 0);
        this.updateElement('connections-count', this.userStats?.followers || 0);
        this.updateElement('following-count', this.userStats?.following || 0);
    }

    // Actualizar sección "Acerca de mí"
    async updateAboutSection() {
        this.updateElement('profile-bio', this.profileData.bio || 'Este usuario aún no ha agregado una biografía.');
        
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            this.updateElement('profile-email', user?.email || 'No disponible');
        } catch (error) {
            console.warn('Error obteniendo email del usuario:', error);
            this.updateElement('profile-email', 'No disponible');
        }
        
        const joinedDate = this.profileData.created_at ? 
            new Date(this.profileData.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
            }) : 'Fecha no disponible';
        this.updateElement('profile-joined', `Miembro desde ${joinedDate}`);
        
        // Website
        const websiteLink = document.getElementById('profile-website');
        if (websiteLink && this.profileData.social_links?.website) {
            websiteLink.href = this.profileData.social_links.website;
            websiteLink.textContent = this.profileData.social_links.website;
            websiteLink.style.display = 'inline';
        } else if (websiteLink) {
            websiteLink.style.display = 'none';
        }
    }

    // Actualizar sección de habilidades
    updateSkillsSection() {
        const skillsList = document.getElementById('skills-list');
        if (!skillsList) return;

        skillsList.innerHTML = '';

        if (!this.profileData.skills || this.profileData.skills.length === 0) {
            skillsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <p>${this.isOwnProfile ? 'Añade tus primeras habilidades' : 'No hay habilidades mostradas'}</p>
                </div>
            `;
            return;
        }

        // Agrupar habilidades por categoría (simulado por ahora)
        const frontendSkills = this.profileData.skills.filter(skill => 
            ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html'].includes(skill.toLowerCase())
        );
        const backendSkills = this.profileData.skills.filter(skill => 
            ['node', 'python', 'java', 'php', 'ruby', 'go', 'sql'].includes(skill.toLowerCase())
        );
        const otherSkills = this.profileData.skills.filter(skill => 
            ![...frontendSkills, ...backendSkills].includes(skill)
        );

        const categories = [];
        if (frontendSkills.length > 0) categories.push({ name: 'Frontend', skills: frontendSkills });
        if (backendSkills.length > 0) categories.push({ name: 'Backend', skills: backendSkills });
        if (otherSkills.length > 0) categories.push({ name: 'Otras Tecnologías', skills: otherSkills });

        if (categories.length === 0) {
            // Mostrar todas las habilidades en una categoría
            categories.push({ name: 'Habilidades', skills: this.profileData.skills });
        }

        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'skill-category';
            
            categoryElement.innerHTML = `
                <h3>${category.name}</h3>
                <div class="skill-tags">
                    ${category.skills.map(skill => 
                        `<span class="skill-tag">${skill}</span>`
                    ).join('')}
                </div>
            `;
            
            skillsList.appendChild(categoryElement);
        });
    }

    // Actualizar sección de proyectos
    updateProjectsSection() {
        const projectsGrid = document.getElementById('profile-projects');
        if (!projectsGrid) return;

        projectsGrid.innerHTML = '';

        if (!this.userProjects || this.userProjects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-rocket"></i>
                    <p>${this.isOwnProfile ? 'Crea tu primer proyecto' : 'No hay proyectos públicos'}</p>
                    ${this.isOwnProfile ? 
                        '<a href="../dashboard.html" class="btn-primary" style="margin-top: 10px;">Crear Proyecto</a>' : 
                        ''
                    }
                </div>
            `;
            return;
        }

        this.userProjects.forEach(project => {
            const projectCard = document.createElement('a');
            // 🔥 CORREGIR RUTA - ahora estamos en html/profile.html
            projectCard.href = `../project-details.html?slug=${project.slug}`;
            projectCard.className = 'project-mini-card';
            
            projectCard.innerHTML = `
                <h4 class="project-mini-title">${project.title}</h4>
                <p class="project-mini-description">${project.subtitle || 'Sin descripción'}</p>
                <div class="project-mini-meta">
                    <span class="project-status ${project.status}">${this.formatProjectStatus(project.status)}</span>
                </div>
            `;
            
            projectsGrid.appendChild(projectCard);
        });
    }

    // Actualizar estadísticas sociales
    updateSocialStats() {
        this.updateElement('likes-count', this.socialStats?.likes || 0);
        this.updateElement('comments-count', this.socialStats?.comments || 0);
        this.updateElement('shares-count', this.socialStats?.shares || 0);
    }

    // Actualizar botones de acción
    updateActionButtons() {
        const actionsContainer = document.getElementById('profile-actions');
        if (!actionsContainer) return;

        if (this.isOwnProfile) {
            // Botones para el propio perfil
            actionsContainer.innerHTML = `
                <button class="btn-secondary" id="edit-profile-btn">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
                <button class="btn-primary" id="share-profile-btn">
                    <i class="fas fa-share-alt"></i> Compartir
                </button>
            `;
        } else {
            // Botones para perfiles de otros usuarios
            actionsContainer.innerHTML = `
                <button class="btn-follow" id="follow-btn">
                    <i class="fas fa-user-plus"></i> Seguir
                </button>
                <button class="btn-message" id="message-btn">
                    <i class="fas fa-envelope"></i> Mensaje
                </button>
            `;
        }

        // Re-configurar event listeners para los nuevos botones
        this.setupActionButtons();
    }

    // Configurar visibilidad de elementos de edición
    setupProfileVisibility() {
        const editButtons = document.querySelectorAll('.btn-edit');
        const avatarEditBtn = document.getElementById('avatar-edit-btn');

        if (this.isOwnProfile) {
            // Mostrar elementos de edición
            editButtons.forEach(btn => btn.style.display = 'flex');
            if (avatarEditBtn) avatarEditBtn.style.display = 'flex';
        } else {
            // Ocultar elementos de edición
            editButtons.forEach(btn => btn.style.display = 'none');
            if (avatarEditBtn) avatarEditBtn.style.display = 'none';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        this.setupActionButtons();
        this.setupEditButtons();
    }

    // Configurar botones de acción
    setupActionButtons() {
        // Editar perfil (solo para propio perfil)
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.editProfile());
        }

        // Compartir perfil
        const shareProfileBtn = document.getElementById('share-profile-btn');
        if (shareProfileBtn) {
            shareProfileBtn.addEventListener('click', () => this.shareProfile());
        }

        // Seguir usuario (solo para otros perfiles)
        const followBtn = document.getElementById('follow-btn');
        if (followBtn) {
            followBtn.addEventListener('click', () => this.toggleFollow());
        }

        // Enviar mensaje (solo para otros perfiles)
        const messageBtn = document.getElementById('message-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', () => this.sendMessage());
        }
    }

    // Configurar botones de edición
    setupEditButtons() {
        const editButtons = document.querySelectorAll('.btn-edit');
        
        editButtons.forEach(button => {
            if (!this.isOwnProfile) return;
            
            button.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.editSection(section);
            });
        });

        // Editar avatar
        const avatarEditBtn = document.getElementById('avatar-edit-btn');
        if (avatarEditBtn && this.isOwnProfile) {
            avatarEditBtn.addEventListener('click', () => this.editAvatar());
        }
    }

    // Helper para actualizar elementos del DOM
    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    // Formatear estado del proyecto
    formatProjectStatus(status) {
        const statusMap = {
            'planning': 'En Planificación',
            'development': 'En Desarrollo',
            'launched': 'Lanzado'
        };
        return statusMap[status] || status;
    }

    // === MÉTODOS DE ACCIÓN ===

    // Editar perfil completo
    editProfile() {
        console.log('Abrir editor de perfil completo');
        // Por implementar: modal de edición de perfil
        alert('Funcionalidad de edición de perfil - Próximamente');
    }

    // Editar sección específica
    editSection(section) {
        console.log(`Editando sección: ${section}`);
        // Por implementar: modales específicos por sección
        alert(`Editando ${section} - Próximamente`);
    }

    // Editar avatar
    editAvatar() {
        console.log('Abrir editor de avatar');
        // Por implementar: upload de imagen
        alert('Funcionalidad de cambio de avatar - Próximamente');
    }

    // Compartir perfil
    shareProfile() {
        const profileUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: `Perfil de ${this.profileData.full_name}`,
                text: `Mira el perfil de ${this.profileData.full_name} en Proyecto 301`,
                url: profileUrl
            });
        } else {
            navigator.clipboard.writeText(profileUrl).then(() => {
                alert('¡Enlace copiado al portapapeles!');
            });
        }
    }

    // Seguir/dejar de seguir
    async toggleFollow() {
        if (!this.currentUserId) {
            alert('Debes iniciar sesión para seguir usuarios');
            return;
        }

        // Por implementar cuando tengamos la tabla de followers
        console.log('Toggle follow para usuario:', this.currentProfileId);
        alert('Funcionalidad de seguir - Próximamente');
    }

    // Enviar mensaje
    sendMessage() {
        if (!this.currentUserId) {
            alert('Debes iniciar sesión para enviar mensajes');
            return;
        }

        // Por implementar cuando tengamos el sistema de mensajes
        console.log('Enviar mensaje a:', this.currentProfileId);
        alert('Sistema de mensajes - Próximamente');
    }

    // Mostrar error
// En updateProjectsSection - corregir rutas
updateProjectsSection() {
    const projectsGrid = document.getElementById('profile-projects');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = '';

    if (!this.userProjects || this.userProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-rocket"></i>
                <p>${this.isOwnProfile ? 'Crea tu primer proyecto' : 'No hay proyectos públicos'}</p>
                ${this.isOwnProfile ? 
                    '<a href="../dashboard.html" class="btn-primary" style="margin-top: 10px;">Crear Proyecto</a>' : 
                    ''
                }
            </div>
        `;
        return;
    }

    this.userProjects.forEach(project => {
        const projectCard = document.createElement('a');
        // 🔥 CORREGIR RUTA - ahora estamos en html/profile.html
        projectCard.href = `../project-details.html?slug=${project.slug}`;
        projectCard.className = 'project-mini-card';
        
        projectCard.innerHTML = `
            <h4 class="project-mini-title">${project.title}</h4>
            <p class="project-mini-description">${project.subtitle || 'Sin descripción'}</p>
            <div class="project-mini-meta">
                <span class="project-status ${project.status}">${this.formatProjectStatus(project.status)}</span>
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
}

// En showError - corregir ruta
    showError() {
        const main = document.querySelector('.profile-main');
        if (main) {
            main.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar el perfil</h3>
                    <p>No se pudo cargar la información del perfil solicitado.</p>
                    <a href="../index.html" class="btn-primary">Volver al Inicio</a>
                </div>
            `;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// Exportar para uso global si es necesario
window.ProfileManager = ProfileManager;