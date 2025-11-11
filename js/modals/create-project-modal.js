// create-project-modal.js - VERSIÓN COMPLETA CON BUSCADOR DE USUARIOS
class CreateProjectModal {
    constructor() {
        console.log('🔄 CreateProjectModal constructor ejecutándose...');
        this.currentStep = 1;
        this.totalSteps = 5;
        
        // 🔥 AGREGAR ESTA PROPIEDAD para controlar edición manual del slug
        this.userEditedSlug = false;
        
        this.projectData = {
            cover: {
                image: null,
                imageFile: null,
                title: '',
                subtitle: '',
                status: 'planning'
            },
            identity: {
                name: '',
                slug: '',
                category: '',
                tags: [],
                description: '',
                solution: '',
                usp: []
            },
            team: {
                members: [],
                rolesNeeded: [],
                collaborationMode: 'remote',
                timeCommitment: 'part-time'
            },
            technology: {
                currentStack: [],
                desiredTech: [],
                expertiseLevel: 'intermediate'
            },
            configuration: {
                activeButtons: ['join-team', 'contact-team'],
                socialLinks: {
                    github: '',
                    linkedin: '',
                    website: ''
                },
                visibility: 'public',
                license: 'open-source',
                needsFunding: false
            }
        };
        
        setTimeout(() => {
            this.init();
        }, 100);
    }

    init() {
        console.log('🎯 Inicializando CreateProjectModal...');
        this.bindEvents();
        this.initImageUpload();
        this.initFormFunctionality();
        this.updateNavigationButtons();
        this.updateProgressBar();
        console.log('✅ CreateProjectModal completamente inicializado');
    }

    bindEvents() {
        console.log('🔗 Enlazando eventos...');
        
        // Navegación
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        const createBtn = document.getElementById('createProject');
        const closeBtn = document.getElementById('closeProjectModal');
        const modal = document.getElementById('createProjectModal');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }
        
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createProject());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeModal();
            });
        }

        console.log('✅ Eventos de navegación enlazados');
    }

    initFormFunctionality() {
        console.log('🔗 Inicializando funcionalidades del formulario...');
        
        // Asegurar que el overlay exista desde el inicio
        this.ensureOverlayExists();
        
        // Título y subtítulo de portada
        const titleInput = document.querySelector('.cover-title-input');
        const subtitleInput = document.querySelector('.cover-subtitle-input');
        
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.projectData.cover.title = e.target.value;
                this.updatePreview();
            });
        }

        if (subtitleInput) {
            subtitleInput.addEventListener('input', (e) => {
                this.projectData.cover.subtitle = e.target.value;
                this.updatePreview();
            });
        }

        // Estado del proyecto
        const statusBadges = document.querySelectorAll('.status-badge');
        statusBadges.forEach(badge => {
            badge.addEventListener('click', () => {
                statusBadges.forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                this.projectData.cover.status = badge.dataset.status;
                this.updatePreview();
            });
        });

        // 🔥 CORRECCIÓN: Nombre del proyecto y slug - VERSIÓN MEJORADA
        const nameInput = document.getElementById('projectName');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.projectData.identity.name = e.target.value;
                
                // 🔥 GENERAR SLUG SIEMPRE que se escriba en el nombre
                this.generateSlug(e.target.value);
                this.updatePreview();
            });
        }

        // 🔥 CORRECCIÓN: Input de slug - permitir edición manual
        const slugInput = document.getElementById('projectSlug');
        if (slugInput) {
            let originalSlug = slugInput.value;
            
            slugInput.addEventListener('input', (e) => {
                // 🔥 Marcar que el usuario editó manualmente si el valor cambió del original
                if (e.target.value !== originalSlug) {
                    this.userEditedSlug = true;
                }
                
                // 🔥 ACTUALIZAR EL SLUG MANUALMENTE cuando el usuario edite
                this.projectData.identity.slug = e.target.value;
            });
            
            slugInput.addEventListener('blur', (e) => {
                // 🔥 VALIDAR Y FORMATEAR el slug cuando pierda el foco
                this.validateAndFormatSlug(e.target);
            });
        }

        // Categoría del proyecto
        const categorySelect = document.getElementById('projectCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.projectData.identity.category = e.target.value;
            });
        }

        // Tags del proyecto
        const tagsInput = document.getElementById('projectTags');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    this.addTag(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // Descripción y solución
        const descriptionInput = document.getElementById('projectDescription');
        const solutionInput = document.getElementById('projectSolution');
        
        if (descriptionInput) {
            descriptionInput.addEventListener('input', (e) => {
                this.projectData.identity.description = e.target.value;
            });
        }
        
        if (solutionInput) {
            solutionInput.addEventListener('input', (e) => {
                this.projectData.identity.solution = e.target.value;
            });
        }

        // USP inputs
        const uspInputs = document.querySelectorAll('.usp-input');
        uspInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                this.projectData.identity.usp[index] = e.target.value;
            });
        });

        // Roles necesarios
        const roleSelect = document.getElementById('roleSelect');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.addRole(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Tecnologías actuales
        const techSearchInput = document.getElementById('techSearchInput');
        if (techSearchInput) {
            techSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    this.addCurrentTech(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // Tecnologías deseadas
        const desiredTechInput = document.getElementById('desiredTechInput');
        if (desiredTechInput) {
            desiredTechInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    this.addDesiredTech(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // Botones de acción
        const toggleOptions = document.querySelectorAll('.toggle-option input[type="checkbox"]');
        toggleOptions.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const buttonName = e.target.name;
                if (e.target.checked) {
                    if (!this.projectData.configuration.activeButtons.includes(buttonName)) {
                        this.projectData.configuration.activeButtons.push(buttonName);
                    }
                } else {
                    this.projectData.configuration.activeButtons = 
                        this.projectData.configuration.activeButtons.filter(btn => btn !== buttonName);
                }
                this.updatePreview();
            });
        });

        // Modo de colaboración
        const collaborationRadios = document.querySelectorAll('input[name="collaboration-mode"]');
        collaborationRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.projectData.team.collaborationMode = e.target.value;
                }
            });
        });

        // Compromiso temporal
        const commitmentRadios = document.querySelectorAll('input[name="time-commitment"]');
        commitmentRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.projectData.team.timeCommitment = e.target.value;
                }
            });
        });

        // Nivel de expertise
        const expertiseRadios = document.querySelectorAll('input[name="expertise-level"]');
        expertiseRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.projectData.technology.expertiseLevel = e.target.value;
                }
            });
        });

        // Visibilidad del proyecto
        const visibilitySelect = document.getElementById('projectVisibility');
        if (visibilitySelect) {
            visibilitySelect.addEventListener('change', (e) => {
                this.projectData.configuration.visibility = e.target.value;
            });
        }

        // Licencia
        const licenseSelect = document.getElementById('projectLicense');
        if (licenseSelect) {
            licenseSelect.addEventListener('change', (e) => {
                this.projectData.configuration.license = e.target.value;
            });
        }

        // Necesita financiamiento
        const fundingCheckbox = document.getElementById('needsFunding');
        if (fundingCheckbox) {
            fundingCheckbox.addEventListener('change', (e) => {
                this.projectData.configuration.needsFunding = e.target.checked;
            });
        }

        // Redes sociales
        const socialInputs = document.querySelectorAll('.social-input input');
        socialInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const platform = e.target.parentElement.querySelector('i').className;
                if (platform.includes('github')) {
                    this.projectData.configuration.socialLinks.github = e.target.value;
                } else if (platform.includes('linkedin')) {
                    this.projectData.configuration.socialLinks.linkedin = e.target.value;
                } else if (platform.includes('globe')) {
                    this.projectData.configuration.socialLinks.website = e.target.value;
                }
            });
        });

        // 🔥 INICIALIZAR BUSCADOR DE USUARIOS
        this.initUserSearch();

        console.log('✅ Funcionalidades del formulario inicializadas');
    }

    // 🔥 FUNCIONES PARA EL BUSCADOR DE USUARIOS
    initUserSearch() {
        const searchInput = document.getElementById('userSearchInput');
        const searchResults = document.getElementById('userSearchResults');
        
        if (!searchInput) return;

        let searchTimeout;
        let currentSearchTerm = '';

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (!value) {
                this.hideSearchResults();
                return;
            }

            if (value.startsWith('@')) {
                const searchTerm = value.substring(1);
                
                if (searchTerm.length >= 2) {
                    currentSearchTerm = searchTerm;
                    searchTimeout = setTimeout(() => {
                        this.searchUsers(searchTerm);
                    }, 300);
                } else {
                    this.hideSearchResults();
                }
            } else {
                this.hideSearchResults();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                this.hideSearchResults();
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchResults();
            }
        });
    }

    async searchUsers(searchTerm) {
        const searchResults = document.getElementById('userSearchResults');
        
        if (!searchTerm) {
            this.hideSearchResults();
            return;
        }

        try {
            searchResults.innerHTML = `
                <div class="search-loading">
                    <i class="fas fa-spinner fa-spin"></i> Buscando usuarios...
                </div>
            `;
            searchResults.style.display = 'block';

            const { data: users, error } = await window.supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .ilike('username', `%${searchTerm}%`)
                .limit(10);

            if (error) {
                console.error('Error buscando usuarios:', error);
                this.showSearchError();
                return;
            }

            this.displaySearchResults(users, searchTerm);
            
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showSearchError();
        }
    }

    displaySearchResults(users, searchTerm) {
        const searchResults = document.getElementById('userSearchResults');
        
        if (!users || users.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    No se encontraron usuarios con "@${searchTerm}"
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        const resultsHTML = users.map(user => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-avatar">
                    ${user.avatar_url ? 
                        `<img src="${user.avatar_url}" alt="${user.username}" style="width: 100%; height: 100%; border-radius: 50%;">` : 
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="user-info">
                    <div class="user-username">@${user.username}</div>
                    ${user.full_name ? `<div class="user-fullname">${user.full_name}</div>` : ''}
                </div>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHTML;
        searchResults.style.display = 'block';
        this.bindSearchResultEvents();
    }

    bindSearchResultEvents() {
        const searchResults = document.getElementById('userSearchResults');
        const resultItems = searchResults.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const username = item.querySelector('.user-username').textContent.replace('@', '');
                const fullName = item.querySelector('.user-fullname')?.textContent || '';
                
                this.addTeamMember(userId, username, fullName);
                this.hideSearchResults();
                this.clearSearchInput();
            });
        });
    }

    addTeamMember(userId, username, fullName) {
        const existingMember = this.projectData.team.members.find(member => member.id === userId);
        if (existingMember) {
            this.showNotification('Este usuario ya está en el equipo', 'warning');
            return;
        }

        this.projectData.team.members.push({
            id: userId,
            username: username,
            full_name: fullName,
            role: 'collaborator',
            joined_at: new Date().toISOString()
        });

        this.updateSelectedMembersDisplay();
        this.showNotification(`@${username} agregado al equipo`, 'success');
    }

    updateSelectedMembersDisplay() {
        const selectedMembersContainer = document.getElementById('selectedMembers');
        
        if (!selectedMembersContainer) return;

        const ownerCard = selectedMembersContainer.querySelector('.owner');
        selectedMembersContainer.innerHTML = '';
        selectedMembersContainer.appendChild(ownerCard);

        this.projectData.team.members.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'member-card added';
            memberCard.innerHTML = `
                <div class="member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="member-info">
                    <span class="member-name">@${member.username}</span>
                    <span class="member-role">${member.full_name || 'Colaborador'}</span>
                </div>
                <button type="button" class="remove-member" data-user-id="${member.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            selectedMembersContainer.appendChild(memberCard);
        });

        this.bindRemoveMemberEvents();
    }

    bindRemoveMemberEvents() {
        const removeButtons = document.querySelectorAll('.remove-member');
        
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = button.dataset.userId;
                this.removeTeamMember(userId);
            });
        });
    }

    removeTeamMember(userId) {
        const member = this.projectData.team.members.find(m => m.id === userId);
        
        if (member) {
            this.projectData.team.members = this.projectData.team.members.filter(m => m.id !== userId);
            this.updateSelectedMembersDisplay();
            this.showNotification(`@${member.username} removido del equipo`, 'info');
        }
    }

    hideSearchResults() {
        const searchResults = document.getElementById('userSearchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }

    clearSearchInput() {
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    showSearchError() {
        const searchResults = document.getElementById('userSearchResults');
        searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i> Error al buscar usuarios
            </div>
        `;
        searchResults.style.display = 'block';
    }

    // 🔥 FUNCIONES PARA MANEJAR TAGS Y ROLES
    addTag(tagName) {
        if (this.projectData.identity.tags.length >= 5) {
            this.showNotification('Máximo 5 etiquetas permitidas', 'warning');
            return;
        }
        
        if (!this.projectData.identity.tags.includes(tagName)) {
            this.projectData.identity.tags.push(tagName);
            this.updateTagsDisplay();
        }
    }

    removeTag(tagName) {
        this.projectData.identity.tags = this.projectData.identity.tags.filter(tag => tag !== tagName);
        this.updateTagsDisplay();
    }

    updateTagsDisplay() {
        const tagsDisplay = document.querySelector('.tags-display');
        if (tagsDisplay) {
            tagsDisplay.innerHTML = this.projectData.identity.tags.map(tag => `
                <div class="tag">
                    ${tag}
                    <button type="button" class="tag-remove" onclick="CreateProjectModal.getInstance().removeTag('${tag}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    addRole(roleName) {
        if (!this.projectData.team.rolesNeeded.includes(roleName)) {
            this.projectData.team.rolesNeeded.push(roleName);
            this.updateRolesDisplay();
        }
    }

    removeRole(roleName) {
        this.projectData.team.rolesNeeded = this.projectData.team.rolesNeeded.filter(role => role !== roleName);
        this.updateRolesDisplay();
    }

    updateRolesDisplay() {
        const roleTags = document.querySelector('.role-tags');
        if (roleTags) {
            roleTags.innerHTML = this.projectData.team.rolesNeeded.map(role => `
                <div class="role-tag">
                    ${this.getRoleDisplayName(role)}
                    <button type="button" class="tag-remove" onclick="CreateProjectModal.getInstance().removeRole('${role}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    getRoleDisplayName(roleKey) {
        const roleNames = {
            'frontend': 'Frontend Developer',
            'backend': 'Backend Developer',
            'fullstack': 'Full Stack Developer',
            'ui-ux': 'UI/UX Designer',
            'devops': 'DevOps Engineer',
            'data-scientist': 'Data Scientist',
            'product-manager': 'Product Manager',
            'qa': 'QA Tester'
        };
        return roleNames[roleKey] || roleKey;
    }

    addCurrentTech(techName) {
        if (!this.projectData.technology.currentStack.includes(techName)) {
            this.projectData.technology.currentStack.push(techName);
            this.updateCurrentTechDisplay();
        }
    }

    removeCurrentTech(techName) {
        this.projectData.technology.currentStack = this.projectData.technology.currentStack.filter(tech => tech !== techName);
        this.updateCurrentTechDisplay();
    }

    updateCurrentTechDisplay() {
        const selectedTechnologies = document.querySelector('.selected-technologies');
        if (selectedTechnologies) {
            selectedTechnologies.innerHTML = this.projectData.technology.currentStack.map(tech => `
                <div class="tech-tag">
                    ${tech}
                    <button type="button" class="tag-remove" onclick="CreateProjectModal.getInstance().removeCurrentTech('${tech}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    addDesiredTech(techName) {
        if (!this.projectData.technology.desiredTech.includes(techName)) {
            this.projectData.technology.desiredTech.push(techName);
            this.updateDesiredTechDisplay();
        }
    }

    removeDesiredTech(techName) {
        this.projectData.technology.desiredTech = this.projectData.technology.desiredTech.filter(tech => tech !== techName);
        this.updateDesiredTechDisplay();
    }

    updateDesiredTechDisplay() {
        const desiredTechnologies = document.querySelector('.desired-technologies');
        if (desiredTechnologies) {
            desiredTechnologies.innerHTML = this.projectData.technology.desiredTech.map(tech => `
                <div class="tech-tag">
                    ${tech}
                    <button type="button" class="tag-remove" onclick="CreateProjectModal.getInstance().removeDesiredTech('${tech}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    // 🔥 NAVEGACIÓN MEJORADA
    nextStep() {
        console.log('➡️ Siguiente paso solicitado - Paso actual:', this.currentStep);
        
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.changeStep(this.currentStep + 1);
            }
        }
    }

    prevStep() {
        console.log('⬅️ Paso anterior solicitado');
        if (this.currentStep > 1) {
            this.changeStep(this.currentStep - 1);
        }
    }

    changeStep(step) {
        console.log(`🔄 Cambiando al paso ${step} desde ${this.currentStep}`);
        
        // Ocultar paso actual
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
        
        // Mostrar nuevo paso
        const newStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        if (newStepElement) {
            newStepElement.classList.add('active');
        }
        
        this.currentStep = step;
        this.updateNavigationButtons();
        this.updateProgressBar();
        
        // Scroll al top del modal body
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }

    // 🔥 ACTUALIZACIÓN DINÁMICA DE BOTONES
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const createBtn = document.getElementById('createProject');
        const stepIndicator = document.querySelector('.current-step');
        
        console.log('🔄 Actualizando botones de navegación... Paso actual:', this.currentStep);
        
        // Botón Anterior - mostrar solo si no estamos en el paso 1
        if (prevBtn) {
            if (this.currentStep > 1) {
                prevBtn.classList.remove('btn-hidden');
                prevBtn.classList.add('btn-visible');
            } else {
                prevBtn.classList.remove('btn-visible');
                prevBtn.classList.add('btn-hidden');
            }
        }
        
        // Botón Siguiente - mostrar solo si no estamos en el último paso
        if (nextBtn) {
            if (this.currentStep < this.totalSteps) {
                nextBtn.classList.remove('btn-hidden');
                nextBtn.classList.add('btn-visible');
            } else {
                nextBtn.classList.remove('btn-visible');
                nextBtn.classList.add('btn-hidden');
            }
        }
        
        // 🔥 Botón Crear - mostrar SOLO en el paso 5
        if (createBtn) {
            if (this.currentStep === this.totalSteps) {
                createBtn.classList.remove('btn-hidden');
                createBtn.classList.add('btn-visible');
                console.log('✅ Botón Crear Proyecto MOSTRADO (paso 5)');
            } else {
                createBtn.classList.remove('btn-visible');
                createBtn.classList.add('btn-hidden');
                console.log('❌ Botón Crear Proyecto OCULTADO (paso ' + this.currentStep + ')');
            }
        }
        
        if (stepIndicator) {
            stepIndicator.textContent = `Paso ${this.currentStep} de ${this.totalSteps}`;
        }
    }

    // 🔥 ACTUALIZACIÓN DE BARRA DE PROGRESO
    updateProgressBar() {
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // 🔥 VALIDACIÓN MEJORADA
    validateCurrentStep() {
        console.log(`✅ Validando paso actual ${this.currentStep}`);
        let isValid = true;
        let errorMessage = '';
        
        switch(this.currentStep) {
            case 1:
                if (!this.projectData.cover.title.trim()) {
                    errorMessage = 'Por favor, ingresa un título para tu proyecto';
                    isValid = false;
                }
                break;
                
            case 2:
                // 🔥 VALIDACIÓN MEJORADA DEL SLUG
                if (!this.projectData.identity.name.trim()) {
                    errorMessage = 'El nombre del proyecto es obligatorio';
                    isValid = false;
                } else if (!this.projectData.identity.slug.trim()) {
                    errorMessage = 'La URL única es obligatoria';
                    isValid = false;
                } else if (this.projectData.identity.slug.length < 3) {
                    errorMessage = 'La URL única debe tener al menos 3 caracteres';
                    isValid = false;
                } else if (!/^[a-z0-9\-]+$/.test(this.projectData.identity.slug)) {
                    errorMessage = 'La URL solo puede contener letras minúsculas, números y guiones';
                    isValid = false;
                }
                break;
                
            case 3:
                // Sin validaciones obligatorias para equipo
                break;
                
            case 4:
                // Sin validaciones obligatorias para tecnologías
                break;
                
            case 5:
                // Validación final antes de crear
                if (!this.projectData.identity.name.trim()) {
                    errorMessage = 'El nombre del proyecto es obligatorio';
                    isValid = false;
                } else if (!this.projectData.identity.slug.trim() || this.projectData.identity.slug.length < 3) {
                    errorMessage = 'La URL única debe tener al menos 3 caracteres';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid && errorMessage) {
            this.showNotification(errorMessage, 'error');
            
            // 🔥 RESALTAR CAMPO CON ERROR
            this.highlightErrorField(this.currentStep);
        }
        
        console.log(`✅ Validación paso ${this.currentStep}: ${isValid ? 'APROBADO' : 'RECHAZADO'}`);
        return isValid;
    }

    // 🔥 FUNCIONALIDADES DE IMAGEN
    initImageUpload() {
        const uploadBtn = document.querySelector('.btn-upload-image');
        const coverPreview = document.querySelector('.cover-preview');
        
        if (uploadBtn && coverPreview) {
            uploadBtn.addEventListener('click', () => this.openImagePicker());
            
            // Asegurar que el overlay exista desde el inicio
            this.ensureOverlayExists();
            
            // Drag and drop
            coverPreview.addEventListener('dragover', (e) => {
                e.preventDefault();
                coverPreview.style.borderColor = '#6a11cb';
            });

            coverPreview.addEventListener('dragleave', (e) => {
                e.preventDefault();
                coverPreview.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            });

            coverPreview.addEventListener('drop', (e) => {
                e.preventDefault();
                coverPreview.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleImageFile(files[0]);
                }
            });
        }
    }

    ensureOverlayExists() {
        const coverPreview = document.querySelector('.cover-preview');
        if (coverPreview && !coverPreview.querySelector('.cover-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'cover-overlay';
            overlay.innerHTML = `
                <input type="text" class="cover-title-input" placeholder="Título de tu proyecto" maxlength="60">
                <input type="text" class="cover-subtitle-input" placeholder="Subtítulo o tagline" maxlength="120">
            `;
            coverPreview.appendChild(overlay);
            this.rebindOverlayEvents();
        }
    }

    openImagePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleImageFile(file);
        });
        input.click();
    }

    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecciona un archivo de imagen válido', 'error');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showNotification('La imagen es demasiado grande. Máximo 5MB permitido', 'error');
            return;
        }

        this.showImageLoader();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.projectData.cover.image = e.target.result;
            this.projectData.cover.imageFile = file;
            this.displayImagePreview(e.target.result);
            this.showNotification('Imagen de portada cargada exitosamente', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('Error al cargar la imagen', 'error');
            this.hideImageLoader();
        };
        
        reader.readAsDataURL(file);
    }

    showImageLoader() {
        const imagePlaceholder = document.querySelector('.cover-image-placeholder');
        if (imagePlaceholder) {
            imagePlaceholder.innerHTML = `
                <div class="image-loader">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando imagen...</p>
                </div>
            `;
        }
    }

    hideImageLoader() {
        const imagePlaceholder = document.querySelector('.cover-image-placeholder');
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
    }

    displayImagePreview(imageDataURL) {
        const coverPreview = document.querySelector('.cover-preview');
        const imagePlaceholder = document.querySelector('.cover-image-placeholder');
        
        if (coverPreview && imagePlaceholder) {
            // Limpiar solo la imagen anterior, NO el overlay
            const existingImg = coverPreview.querySelector('.cover-image');
            if (existingImg) existingImg.remove();
            
            // Verificar si ya existe el overlay, si no, crearlo
            let overlay = coverPreview.querySelector('.cover-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'cover-overlay';
                overlay.innerHTML = `
                    <input type="text" class="cover-title-input" placeholder="Título de tu proyecto" maxlength="60">
                    <input type="text" class="cover-subtitle-input" placeholder="Subtítulo o tagline" maxlength="120">
                `;
                coverPreview.appendChild(overlay);
                
                // Re-enlazar eventos después de recrear el overlay
                this.rebindOverlayEvents();
            }
            
            // Crear nueva imagen CON CLASE CSS
            const img = document.createElement('img');
            img.className = 'cover-image';
            img.src = imageDataURL;
            
            // Insertar la imagen al inicio (detrás de todo)
            coverPreview.insertBefore(img, coverPreview.firstChild);
            
            imagePlaceholder.style.display = 'none';
            this.addRemoveImageButton(coverPreview);
            
            // 🔥 Actualizar los valores de los inputs si ya existen datos
            this.updateOverlayInputs();
        }
    }

    rebindOverlayEvents() {
        const titleInput = document.querySelector('.cover-title-input');
        const subtitleInput = document.querySelector('.cover-subtitle-input');
        
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.projectData.cover.title = e.target.value;
                this.updatePreview();
            });
            
            // Restaurar valor si ya existe
            if (this.projectData.cover.title) {
                titleInput.value = this.projectData.cover.title;
            }
        }

        if (subtitleInput) {
            subtitleInput.addEventListener('input', (e) => {
                this.projectData.cover.subtitle = e.target.value;
                this.updatePreview();
            });
            
            // Restaurar valor si ya existe
            if (this.projectData.cover.subtitle) {
                subtitleInput.value = this.projectData.cover.subtitle;
            }
        }
    }

    updateOverlayInputs() {
        const titleInput = document.querySelector('.cover-title-input');
        const subtitleInput = document.querySelector('.cover-subtitle-input');
        
        if (titleInput && this.projectData.cover.title) {
            titleInput.value = this.projectData.cover.title;
        }
        
        if (subtitleInput && this.projectData.cover.subtitle) {
            subtitleInput.value = this.projectData.cover.subtitle;
        }
    }

    addRemoveImageButton(coverPreview) {
        const existingBtn = coverPreview.querySelector('.remove-image-btn');
        if (existingBtn) existingBtn.remove();
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Eliminar imagen';
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage();
        });
        
        coverPreview.appendChild(removeBtn);
    }

    removeImage() {
        const coverPreview = document.querySelector('.cover-preview');
        const imagePlaceholder = document.querySelector('.cover-image-placeholder');
        
        if (coverPreview && imagePlaceholder) {
            const imageContainer = coverPreview.querySelector('.cover-image');
            const removeBtn = coverPreview.querySelector('.remove-image-btn');
            
            if (imageContainer) imageContainer.remove();
            if (removeBtn) removeBtn.remove();
            
            // Mostrar placeholder pero mantener el overlay
            imagePlaceholder.style.display = 'flex';
            this.projectData.cover.image = null;
            this.projectData.cover.imageFile = null;
            
            this.showNotification('Imagen eliminada', 'info');
        }
    }

    // 🔥 PREVIEW MEJORADO
    updatePreview() {
        const previewTitle = document.querySelector('.preview-title');
        const previewSubtitle = document.querySelector('.preview-subtitle');
        const previewActions = document.querySelector('.preview-actions');
        
        if (previewTitle) {
            previewTitle.textContent = this.projectData.cover.title || 'Título del Proyecto';
        }
        
        if (previewSubtitle) {
            previewSubtitle.textContent = this.projectData.cover.subtitle || 'Subtítulo del proyecto';
        }
        
        if (previewActions) {
            previewActions.innerHTML = '';
            this.projectData.configuration.activeButtons.forEach(button => {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'btn-action-preview';
                actionBtn.innerHTML = this.getButtonIcon(button);
                actionBtn.title = this.getButtonTitle(button);
                previewActions.appendChild(actionBtn);
            });
        }
    }

    getButtonIcon(buttonName) {
        const icons = {
            'join-team': '<i class="fas fa-user-plus"></i>',
            'contact-team': '<i class="fas fa-envelope"></i>',
            'suggest-ideas': '<i class="fas fa-lightbulb"></i>',
            'express-tasks': '<i class="fas fa-bolt"></i>'
        };
        return icons[buttonName] || '<i class="fas fa-question"></i>';
    }

    getButtonTitle(buttonName) {
        const titles = {
            'join-team': 'Unirse al equipo',
            'contact-team': 'Contactar equipo',
            'suggest-ideas': 'Sugerir ideas',
            'express-tasks': 'Tareas express'
        };
        return titles[buttonName] || 'Acción';
    }

    // 🔥 FUNCIÓN CORREGIDA: Generar slug
    generateSlug(name) {
        const slugInput = document.getElementById('projectSlug');
        if (slugInput) {
            // 🔥 SOLUCIÓN: Generar slug automáticamente SIEMPRE que el nombre cambie
            // pero solo si el usuario no ha editado manualmente el slug
            if (!this.userEditedSlug) {
                const newSlug = this.slugify(name);
                this.projectData.identity.slug = newSlug;
                slugInput.value = newSlug;
                
                // 🔥 Validar inmediatamente después de generar
                this.validateSlugInput(slugInput);
            }
        }
    }

    // 🔥 NUEVA FUNCIÓN: Validar y formatear slug
    validateAndFormatSlug(inputElement) {
        if (!inputElement.value.trim()) {
            // Si está vacío, generar desde el nombre
            this.userEditedSlug = false;
            this.generateSlug(this.projectData.identity.name);
            return;
        }

        // Formatear el slug
        const formattedSlug = this.slugify(inputElement.value);
        if (formattedSlug !== inputElement.value) {
            inputElement.value = formattedSlug;
            this.projectData.identity.slug = formattedSlug;
        }

        // Validar longitud
        this.validateSlugInput(inputElement);
    }

    // 🔥 NUEVA FUNCIÓN: Validar input de slug
    validateSlugInput(inputElement) {
        const value = inputElement.value.trim();
        const isValid = value.length >= 3;
        
        // Aplicar estilos visuales
        if (value.length > 0 && value.length < 3) {
            inputElement.style.borderColor = '#ef4444';
            inputElement.title = 'La URL debe tener al menos 3 caracteres';
        } else {
            inputElement.style.borderColor = '';
            inputElement.title = '';
        }
        
        return isValid;
    }

    // 🔥 NUEVA FUNCIÓN: Resaltar campo con error
    highlightErrorField(step) {
        // Remover resaltados anteriores
        const previousErrors = document.querySelectorAll('.field-error');
        previousErrors.forEach(el => el.classList.remove('field-error'));
        
        switch(step) {
            case 1:
                const titleInput = document.querySelector('.cover-title-input');
                if (titleInput) titleInput.classList.add('field-error');
                break;
                
            case 2:
                if (!this.projectData.identity.name.trim()) {
                    const nameInput = document.getElementById('projectName');
                    if (nameInput) nameInput.classList.add('field-error');
                } else if (!this.projectData.identity.slug.trim() || this.projectData.identity.slug.length < 3) {
                    const slugInput = document.getElementById('projectSlug');
                    if (slugInput) slugInput.classList.add('field-error');
                }
                break;
        }
    }

    slugify(text) {
        if (!text) return '';
        
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD') // Separar acentos
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
            .substring(0, 50); // Limitar longitud
    }

    // 🔥 CREACIÓN DE PROYECTO - VERSIÓN COMPLETA CON SUPABASE
    async createProject() {
        console.log('🚀 Creando proyecto...', this.projectData);
        
        if (!this.validateCurrentStep()) {
            return;
        }

        try {
            this.showNotification('Creando proyecto...', 'info');
            
            // 🔥 1. Obtener el usuario actual PRIMERO
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
            }
            
            // 🔥 2. Subir imagen a Supabase Storage si existe
            let coverImageUrl = null;
            if (this.projectData.cover.imageFile) {
                try {
                    coverImageUrl = await this.uploadImageToStorage();
                } catch (error) {
                    console.error('Error subiendo imagen:', error);
                    this.showNotification('Error al subir la imagen. Continuando sin imagen...', 'warning');
                    // Continuar sin imagen
                }
            }
            
            // 🔥 3. Preparar datos para la tabla 'projects'
            const projectData = {
                // Portada
                title: this.projectData.cover.title,
                subtitle: this.projectData.cover.subtitle,
                cover_image_url: coverImageUrl,
                status: this.projectData.cover.status,
                
                // Identidad
                name: this.projectData.identity.name,
                slug: this.projectData.identity.slug,
                category: this.projectData.identity.category,
                description: this.projectData.identity.description,
                problem_solution: this.projectData.identity.solution,
                usp: this.projectData.identity.usp.filter(usp => usp && usp.trim()),
                tags: this.projectData.identity.tags,
                
                // Equipo
                collaboration_mode: this.projectData.team.collaborationMode,
                time_commitment: this.projectData.team.timeCommitment,
                
                // Tecnologías
                technologies: this.projectData.technology.currentStack,
                expertise_level: this.projectData.technology.expertiseLevel,
                
                // Configuración
                active_buttons: this.projectData.configuration.activeButtons,
                social_links: this.projectData.configuration.socialLinks,
                visibility: this.projectData.configuration.visibility,
                license: this.projectData.configuration.license,
                needs_funding: this.projectData.configuration.needsFunding,
                
                // Metadatos
                created_by: currentUser.id
            };
            
            console.log('📦 Datos listos para Supabase:', projectData);
            
            // 🔥 4. GUARDAR PROYECTO PRINCIPAL
            const { data: project, error: projectError } = await window.supabase
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (projectError) {
                console.error('Error guardando proyecto:', projectError);
                
                if (projectError.code === '23505') { // Violación de unique constraint
                    throw new Error('Ya existe un proyecto con esa URL única. Por favor, cambia el slug.');
                } else if (projectError.message.includes('recursion')) {
                    throw new Error('Error de configuración en la base de datos. Por favor, contacta al administrador.');
                } else {
                    throw new Error(`Error del servidor: ${projectError.message}`);
                }
            }

            console.log('✅ Proyecto guardado en Supabase:', project);
            
            // 🔥 5. Guardar roles necesarios (si existen)
            if (this.projectData.team.rolesNeeded.length > 0) {
                try {
                    await this.saveProjectRoles(project.id);
                } catch (error) {
                    console.error('Error guardando roles:', error);
                    // Continuar aunque falle guardar roles
                }
            }
            
            // 🔥 6. Guardar tecnologías deseadas (si existen)
            if (this.projectData.technology.desiredTech.length > 0) {
                try {
                    await this.saveDesiredTechnologies(project.id);
                } catch (error) {
                    console.error('Error guardando tecnologías deseadas:', error);
                    // Continuar aunque falle guardar tecnologías
                }
            }

            this.showNotification('¡Proyecto creado exitosamente! 🎉', 'success');

            // 🔥 ACTUALIZAR LA LISTA DE PROYECTOS
            if (window.refreshUserProjects) {
                window.refreshUserProjects();
            }

            // Cerrar modal después de éxito
            setTimeout(() => {
                this.closeModal();
            }, 2000);
            
        } catch (error) {
            console.error('Error creando proyecto:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // 🔥 FUNCIÓN PARA GUARDAR ROLES NECESARIOS
    async saveProjectRoles(projectId) {
        try {
            const rolesData = this.projectData.team.rolesNeeded.map(role => ({
                project_id: projectId,
                role_name: role,
                created_at: new Date().toISOString()
            }));

            const { error } = await window.supabase
                .from('project_roles')
                .insert(rolesData);

            if (error) throw error;
            
            console.log('✅ Roles guardados:', rolesData);
        } catch (error) {
            console.error('Error guardando roles:', error);
            throw error;
        }
    }

    // 🔥 FUNCIÓN PARA GUARDAR TECNOLOGÍAS DESEADAS
    async saveDesiredTechnologies(projectId) {
        try {
            const techData = this.projectData.technology.desiredTech.map(tech => ({
                project_id: projectId,
                technology_name: tech,
                created_at: new Date().toISOString()
            }));

            const { error } = await window.supabase
                .from('project_desired_tech')
                .insert(techData);

            if (error) throw error;
            
            console.log('✅ Tecnologías deseadas guardadas:', techData);
        } catch (error) {
            console.error('Error guardando tecnologías deseadas:', error);
            throw error;
        }
    }

    async uploadImageToStorage() {
        if (!this.projectData.cover.imageFile) {
            return null;
        }

        try {
            this.showNotification('Subiendo imagen...', 'info');
            
            const fileExt = this.projectData.cover.imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `project-covers/${fileName}`;

            console.log('📤 Subiendo imagen:', filePath);
            
            const { data, error } = await window.supabase.storage
                .from('project-covers')
                .upload(filePath, this.projectData.cover.imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error detallado subiendo imagen:', error);
                
                if (error.message.includes('bucket')) {
                    throw new Error('El bucket de imágenes no está configurado. Contacta al administrador.');
                } else if (error.message.includes('row-level security')) {
                    throw new Error('No tienes permisos para subir imágenes. Inicia sesión nuevamente.');
                } else {
                    throw new Error(`Error subiendo imagen: ${error.message}`);
                }
            }

            const { data: { publicUrl } } = window.supabase.storage
                .from('project-covers')
                .getPublicUrl(filePath);

            console.log('✅ Imagen subida exitosamente:', publicUrl);
            this.showNotification('Imagen subida exitosamente', 'success');
            return publicUrl;

        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            throw error; // Re-lanzar el error para manejarlo arriba
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
            }
            return user;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            throw error;
        }
    }

    redirectToProject(slug) {
        // Opción 1: Redirigir a la página del proyecto
        window.location.href = `/proyectos/${slug}`;
        
        // Opción 2: Recargar la lista de proyectos
        // window.location.reload();
        
        // Opción 3: Mostrar mensaje de éxito y cerrar
        // this.showNotification('Proyecto creado exitosamente!', 'success');
    }

    closeModal() {
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            this.resetForm();
        }
    }

    resetForm() {
        this.currentStep = 1;
        this.projectData = {
            cover: { image: null, imageFile: null, title: '', subtitle: '', status: 'planning' },
            identity: { name: '', slug: '', category: '', tags: [], description: '', solution: '', usp: [] },
            team: { members: [], rolesNeeded: [], collaborationMode: 'remote', timeCommitment: 'part-time' },
            technology: { currentStack: [], desiredTech: [], expertiseLevel: 'intermediate' },
            configuration: { 
                activeButtons: ['join-team', 'contact-team'],
                socialLinks: { github: '', linkedin: '', website: '' },
                visibility: 'public',
                license: 'open-source',
                needsFunding: false
            }
        };
        
        // 🔥 RESETEAR LA BANDERA DE EDICIÓN MANUAL DEL SLUG
        this.userEditedSlug = false;
        
        this.changeStep(1);
        this.updatePreview();
        
        // Solo remover la imagen, no el overlay
        const coverPreview = document.querySelector('.cover-preview');
        const imagePlaceholder = document.querySelector('.cover-image-placeholder');
        if (coverPreview) {
            const imageContainer = coverPreview.querySelector('.cover-image');
            const removeBtn = coverPreview.querySelector('.remove-image-btn');
            
            if (imageContainer) imageContainer.remove();
            if (removeBtn) removeBtn.remove();
            
            // Asegurar que el overlay esté presente y limpio
            this.ensureOverlayExists();
            
            // Limpiar inputs del overlay
            const titleInput = document.querySelector('.cover-title-input');
            const subtitleInput = document.querySelector('.cover-subtitle-input');
            if (titleInput) titleInput.value = '';
            if (subtitleInput) subtitleInput.value = '';
        }
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
        }
        
        // Limpiar otros inputs y displays
        this.updateTagsDisplay();
        this.updateRolesDisplay();
        this.updateCurrentTechDisplay();
        this.updateDesiredTechDisplay();
        
        // 🔥 LIMPIAR BUSCADOR DE USUARIOS
        this.clearSearchInput();
        this.hideSearchResults();
        this.updateSelectedMembersDisplay();
        
        // Limpiar inputs del formulario
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type !== 'checkbox' && input.type !== 'radio' && 
                !input.classList.contains('cover-title-input') && 
                !input.classList.contains('cover-subtitle-input')) {
                input.value = '';
            } else if (input.type === 'checkbox') {
                input.checked = false;
            }
        });
        
        // Restablecer checkboxes por defecto
        const defaultCheckboxes = document.querySelectorAll('input[name="join-team"], input[name="contact-team"]');
        defaultCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Restablecer radios por defecto
        const defaultRadios = document.querySelectorAll('input[value="remote"], input[value="part-time"], input[value="intermediate"]');
        defaultRadios.forEach(radio => {
            radio.checked = true;
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            font-family: "JetBrains Mono", monospace;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    // 🔥 PATRÓN SINGLETON PARA ACCESO GLOBAL
    static getInstance() {
        if (!CreateProjectModal.instance) {
            CreateProjectModal.instance = new CreateProjectModal();
        }
        return CreateProjectModal.instance;
    }
}

// ✅ EXPORTAR LA CLASE GLOBALMENTE
window.CreateProjectModal = CreateProjectModal;
console.log('✅ CreateProjectModal class exportada globalmente');

// 🔥 INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global
    window.projectModal = CreateProjectModal.getInstance();
});

// Agregar estos estilos CSS para los campos con error
const errorStyles = `
.field-error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}

.slug-help {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 4px;
}

.slug-valid {
    color: #10b981;
}

.slug-invalid {
    color: #ef4444;
}
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);