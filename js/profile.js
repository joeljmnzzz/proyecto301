
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

            console.log('🔍 ProfileIdToLoad:', profileIdToLoad);

            // 🔥 VERIFICAR SI EL USUARIO EXISTE
            if (this.currentProfileId) {
                const userExists = await this.checkUserExists(this.currentProfileId);
                console.log('🔍 ¿Usuario existe en DB?:', userExists);
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
        
        // 🔥 SIEMPRE buscar primero por username
        console.log('🔍 Buscando por username...');
        let { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('username', profileIdentifier)
            .single();

        console.log('🔍 Resultado búsqueda por username:', { profile, error });

        // Si no se encuentra por username, intentar por ID (solo si parece UUID)
        if (error && error.code === 'PGRST116') {
            console.log('🔍 No encontrado por username, verificando si es UUID...');
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileIdentifier);
            
            if (isUUID) {
                console.log('🔍 Es UUID, buscando por ID...');
                ({ data: profile, error } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', profileIdentifier)
                    .single());
                console.log('🔍 Resultado búsqueda por ID:', { profile, error });
            }
        }

        if (error) {
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

    // 🔥 NUEVA FUNCIÓN: Subir foto de perfil
    async uploadProfilePicture(file) {
        try {
            if (!this.isOwnProfile) {
                alert('No tienes permisos para cambiar esta foto de perfil');
                return;
            }

            if (!file || !file.type.startsWith('image/')) {
                alert('Por favor selecciona una imagen válida');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB límite
                alert('La imagen debe ser menor a 5MB');
                return;
            }

            // Mostrar spinner
            if (window.universalSpinner) {
                window.universalSpinner.show('Subiendo foto de perfil...');
            }

            const userId = this.currentUserId;
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/avatar.${fileExt}`;
            
            console.log('📤 Subiendo imagen:', fileName);

            // Subir imagen al bucket profile_pic
            const { data: uploadData, error: uploadError } = await window.supabase
                .storage
                .from('profile_pic')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true // Sobrescribir si ya existe
                });

            if (uploadError) {
                throw uploadError;
            }

            console.log('✅ Imagen subida:', uploadData);

            // Obtener URL pública de la imagen
            const { data: { publicUrl } } = window.supabase
                .storage
                .from('profile_pic')
                .getPublicUrl(fileName);

            console.log('🔗 URL pública:', publicUrl);

            // Actualizar el perfil con la nueva URL del avatar
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ 
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                throw updateError;
            }

            console.log('✅ Perfil actualizado con nueva imagen');

            // Actualizar la imagen en la interfaz inmediatamente
            const avatar = document.getElementById('profile-avatar');
            if (avatar) {
                // Agregar timestamp para evitar cache
                avatar.src = `${publicUrl}?t=${Date.now()}`;
            }

            // Recargar datos del perfil para asegurar consistencia
            await this.loadProfileData(userId);

            alert('¡Foto de perfil actualizada exitosamente!');

        } catch (error) {
            console.error('❌ Error subiendo foto de perfil:', error);
            alert('Error al subir la foto de perfil: ' + error.message);
        } finally {
            if (window.universalSpinner) {
                window.universalSpinner.hide();
            }
        }
    }

    // 🔥 NUEVA FUNCIÓN: Manejar selección de archivo
    setupAvatarUpload() {
        if (!this.isOwnProfile) return;

        // Crear input file oculto
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Configurar evento change
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.uploadProfilePicture(file);
            }
            
            // Limpiar input para permitir seleccionar el mismo archivo otra vez
            fileInput.value = '';
        });

        return fileInput;
    }

    // 🔥 ACTUALIZADO: Editar avatar con funcionalidad real
    editAvatar() {
        if (!this.isOwnProfile) {
            alert('No tienes permisos para editar este avatar');
            return;
        }

        console.log('Abrir selector de archivos para avatar');
        const fileInput = this.setupAvatarUpload();
        fileInput.click();
    }

    // 🔥 NUEVA FUNCIÓN: Eliminar foto de perfil
    async deleteProfilePicture() {
        try {
            if (!this.isOwnProfile) {
                alert('No tienes permisos para eliminar esta foto');
                return;
            }

            if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
                return;
            }

            if (window.universalSpinner) {
                window.universalSpinner.show('Eliminando foto de perfil...');
            }

            const userId = this.currentUserId;

            // Buscar y eliminar todas las imágenes del usuario en el bucket
            const { data: files, error: listError } = await window.supabase
                .storage
                .from('profile_pic')
                .list(userId + '/');

            if (listError) {
                console.warn('No se pudieron listar archivos:', listError);
            }

            // Eliminar archivos si existen
            if (files && files.length > 0) {
                const filePaths = files.map(file => `${userId}/${file.name}`);
                const { error: deleteError } = await window.supabase
                    .storage
                    .from('profile_pic')
                    .remove(filePaths);

                if (deleteError) {
                    console.warn('Error eliminando archivos antiguos:', deleteError);
                }
            }

            // Actualizar perfil para quitar avatar_url
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ 
                    avatar_url: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                throw updateError;
            }

            // Actualizar interfaz
            const avatar = document.getElementById('profile-avatar');
            if (avatar) {
                avatar.src = '../assets/elements/default-avatar.png';
            }

            // Recargar datos
            await this.loadProfileData(userId);

            alert('Foto de perfil eliminada exitosamente');

        } catch (error) {
            console.error('❌ Error eliminando foto de perfil:', error);
            alert('Error al eliminar la foto de perfil: ' + error.message);
        } finally {
            if (window.universalSpinner) {
                window.universalSpinner.hide();
            }
        }
    }

setupEditButtons() {
    const editButtons = document.querySelectorAll('.btn-edit');
    
    editButtons.forEach(button => {
        if (!this.isOwnProfile) return;
        
        button.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            
            // Manejar experiencia de forma modular
            if (section === 'experience') {
                if (window.experienceManager) {
                    window.experienceManager.openExperienceModal();
                }
                return;
            }
            
            this.editSection(section);
        });
    });

    // Editar avatar¿
    const avatarEditBtn = document.getElementById('avatar-edit-btn');
    if (avatarEditBtn && this.isOwnProfile) {
        // Limpiar event listeners anteriores
        avatarEditBtn.replaceWith(avatarEditBtn.cloneNode(true));
        const newAvatarBtn = document.getElementById('avatar-edit-btn');
        
        newAvatarBtn.addEventListener('click', () => this.editAvatar());
        
        // AGREGAR MENÚ CONTEXTUAL PARA ELIMINAR
        this.setupAvatarContextMenu(newAvatarBtn);
    }
}


    // Menú contextual para avatar (editar/eliminar)
    setupAvatarContextMenu(avatarButton) {
        avatarButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Crear menú contextual
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 8px 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                min-width: 150px;
            `;
            
            menu.innerHTML = `
                <div class="menu-item" style="padding: 8px 16px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
                    <i class="fas fa-camera" style="margin-right: 8px;"></i>
                    Cambiar foto
                </div>
                <div class="menu-item" style="padding: 8px 16px; cursor: pointer; color: #e74c3c;">
                    <i class="fas fa-trash" style="margin-right: 8px;"></i>
                    Eliminar foto
                </div>
            `;
            
            document.body.appendChild(menu);
            
            // Event listeners para opciones del menú
            const menuItems = menu.querySelectorAll('.menu-item');
            menuItems[0].addEventListener('click', () => {
                this.editAvatar();
                menu.remove();
            });
            
            menuItems[1].addEventListener('click', () => {
                this.deleteProfilePicture();
                menu.remove();
            });
            
            // Cerrar menú al hacer click fuera
            const closeMenu = (event) => {
                if (!menu.contains(event.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
        });
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

    // 🔥 FUNCIÓN PARA VERIFICAR SI EL USUARIO EXISTE
    async checkUserExists(username) {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .select('username, full_name')
                .eq('username', username)
                .single();

            if (error) {
                console.log('🔍 Usuario no encontrado en DB:', username);
                return false;
            }

            console.log('🔍 Usuario encontrado en DB:', data);
            return true;
        } catch (error) {
            console.error('Error verificando usuario:', error);
            return false;
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

    async loadAdditionalData(profileId) {
        await Promise.all([
            this.loadUserProjects(profileId),
            this.loadUserStats(profileId),
            this.loadSocialStats(profileId),
            this.loadUserExperiences(profileId)
        ]);
    }

    // Cargar experiencias
    async loadUserExperiences(userId) {
        if (window.experienceManager) {
            await window.experienceManager.loadExperiences(userId);
        }
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
        
        // Actualizar timeline de experiencias
        if (window.timelineRenderer) {
            await window.timelineRenderer.renderTimeline();
        }
        
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
    
    // 🔥 CORREGIDO: Eliminar completamente el campo email del DOM
    const emailContainer = document.querySelector('.email-field'); // Buscar el contenedor del email
    if (emailContainer) {
        emailContainer.remove(); // Eliminar completamente del DOM
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
            projectCard.href = `../projectos/${project.slug}`;
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
        projectCard.href = `../proyectos/${project.slug}`;
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