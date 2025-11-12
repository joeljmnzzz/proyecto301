// modals/experience-modal.js
class ExperienceModal {
    constructor() {
        this.modal = null;
        this.currentExperience = null;
        this.isEditing = false;
        this.init();
    }

    init() {
        // Este modal se inicializará cuando se necesite
        console.log('✅ ExperienceModal inicializado');
    }

    // Abrir modal para agregar/editar experiencia
    open(experienceData = null) {
        this.currentExperience = experienceData;
        this.isEditing = !!experienceData;
        
        this.createModal();
        this.renderForm();
        this.setupEventListeners();
        this.showModal();
    }

    // Crear estructura del modal
    createModal() {
        // Eliminar modal existente si hay
        this.close();

        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay experience-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.isEditing ? 'Editar Experiencia' : 'Agregar Experiencia'}</h2>
                    <button class="modal-close" id="experience-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="experience-form" class="experience-form">
                        <!-- Tipo de Experiencia -->
                        <div class="form-group">
                            <label for="experience-type">Tipo de Experiencia *</label>
                            <select id="experience-type" name="type" required>
                                <option value="">Selecciona un tipo</option>
                                <option value="work">Trabajo Tradicional</option>
                                <option value="freelance">Proyecto Freelance</option>
                                <option value="personal">Proyecto Personal</option>
                                <option value="volunteer">Voluntariado</option>
                                <option value="education">Educación/Curso</option>
                            </select>
                        </div>

                        <!-- Campos dinámicos según tipo -->
                        <div id="dynamic-fields"></div>

                        <!-- Tecnologías Utilizadas -->
                        <div class="form-group">
                            <label for="experience-technologies">Tecnologías & Habilidades</label>
                            <div class="tags-input-container">
                                <input type="text" 
                                       id="experience-technologies" 
                                       placeholder="Escribe una tecnología y presiona Enter"
                                       class="tags-input">
                                <div class="tags-list" id="technologies-tags"></div>
                            </div>
                            <small class="form-hint">Estas tecnologías se agregarán automáticamente a tus skills</small>
                        </div>

                        <!-- Período -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="experience-start-date">Fecha Inicio *</label>
                                <input type="month" id="experience-start-date" name="start_date" required>
                            </div>
                            <div class="form-group">
                                <label for="experience-end-date">Fecha Fin</label>
                                <input type="month" id="experience-end-date" name="end_date">
                                <div class="checkbox-group">
                                    <input type="checkbox" id="experience-current" name="current">
                                    <label for="experience-current">Actualmente trabajo aquí</label>
                                </div>
                            </div>
                        </div>

                        <!-- Modalidad -->
                        <div class="form-group">
                            <label for="experience-modality">Modalidad</label>
                            <select id="experience-modality" name="modality">
                                <option value="">Selecciona modalidad</option>
                                <option value="remote">Remoto</option>
                                <option value="hybrid">Híbrido</option>
                                <option value="in-person">Presencial</option>
                            </select>
                        </div>

                        <!-- Logros y Descripción -->
                        <div class="form-group">
                            <label for="experience-achievements">Logros & Responsabilidades</label>
                            <textarea id="experience-achievements" 
                                      name="achievements" 
                                      placeholder="Describe tus logros, responsabilidades o lo que aprendiste..."
                                      rows="4"></textarea>
                            <small class="form-hint">Usa puntos para listar logros cuantificables</small>
                        </div>

                        <!-- Proyectos Relacionados (solo para tipos específicos) -->
                        <div class="form-group" id="project-links-section" style="display: none;">
                            <label for="experience-project-links">Proyectos Relacionados</label>
                            <div class="links-container" id="project-links-container">
                                <div class="link-input-group">
                                    <input type="url" 
                                           class="project-link-input" 
                                           placeholder="https://tuproyecto.com">
                                    <button type="button" class="btn-remove-link">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="button" class="btn-add-link" id="add-project-link">
                                <i class="fas fa-plus"></i> Agregar Enlace
                            </button>
                        </div>

                        <!-- Botones de acción -->
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" id="experience-cancel-btn">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary" id="experience-save-btn">
                                ${this.isEditing ? 'Actualizar' : 'Guardar'} Experiencia
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    // Renderizar campos dinámicos según el tipo de experiencia
    renderForm() {
        if (this.currentExperience) {
            this.populateFormData();
        }
        
        this.setupTypeChangeHandler();
        this.setupTagsHandler();
        this.setupProjectLinksHandler();
    }

    // Poblar formulario con datos existentes (edición)
    populateFormData() {
        const exp = this.currentExperience;
        
        // Llenar campos básicos
        document.getElementById('experience-type').value = exp.type || '';
        document.getElementById('experience-start-date').value = exp.start_date || '';
        document.getElementById('experience-end-date').value = exp.end_date || '';
        document.getElementById('experience-current').checked = exp.current || false;
        document.getElementById('experience-modality').value = exp.modality || '';
        document.getElementById('experience-achievements').value = exp.achievements || '';

        // Llenar tecnologías
        if (exp.technologies && Array.isArray(exp.technologies)) {
            exp.technologies.forEach(tech => this.addTechnologyTag(tech));
        }

        // Actualizar campos dinámicos
        this.updateDynamicFields(exp.type);
        
        // Llenar campos específicos del tipo
        if (exp.type === 'work') {
            document.getElementById('company-name').value = exp.company || '';
            document.getElementById('job-title').value = exp.title || '';
        } else if (exp.type === 'freelance') {
            document.getElementById('client-name').value = exp.client || '';
            document.getElementById('project-role').value = exp.role || '';
        } else if (exp.type === 'personal') {
            document.getElementById('project-name').value = exp.project_name || '';
            document.getElementById('project-url').value = exp.project_url || '';
        } else if (exp.type === 'volunteer') {
            document.getElementById('organization-name').value = exp.organization || '';
            document.getElementById('volunteer-role').value = exp.role || '';
        } else if (exp.type === 'education') {
            document.getElementById('institution-name').value = exp.institution || '';
            document.getElementById('course-name').value = exp.course_name || '';
            document.getElementById('certificate-url').value = exp.certificate_url || '';
        }

        // Llenar enlaces de proyectos
        if (exp.project_links && Array.isArray(exp.project_links)) {
            this.renderProjectLinks(exp.project_links);
        }
    }

    // Actualizar campos dinámicos según tipo
    updateDynamicFields(type) {
        const dynamicFields = document.getElementById('dynamic-fields');
        
        let fieldsHTML = '';

        switch (type) {
            case 'work':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="company-name">Empresa *</label>
                        <input type="text" id="company-name" name="company" required>
                    </div>
                    <div class="form-group">
                        <label for="job-title">Puesto/Cargo *</label>
                        <input type="text" id="job-title" name="title" required>
                    </div>
                `;
                break;

            case 'freelance':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="client-name">Cliente *</label>
                        <input type="text" id="client-name" name="client" required>
                    </div>
                    <div class="form-group">
                        <label for="project-role">Rol en el Proyecto *</label>
                        <input type="text" id="project-role" name="role" required>
                    </div>
                `;
                document.getElementById('project-links-section').style.display = 'block';
                break;

            case 'personal':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="project-name">Nombre del Proyecto *</label>
                        <input type="text" id="project-name" name="project_name" required>
                    </div>
                    <div class="form-group">
                        <label for="project-url">URL del Proyecto</label>
                        <input type="url" id="project-url" name="project_url">
                    </div>
                `;
                break;

            case 'volunteer':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="organization-name">Organización *</label>
                        <input type="text" id="organization-name" name="organization" required>
                    </div>
                    <div class="form-group">
                        <label for="volunteer-role">Rol/Causa *</label>
                        <input type="text" id="volunteer-role" name="role" required>
                    </div>
                `;
                break;

            case 'education':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="institution-name">Institución *</label>
                        <input type="text" id="institution-name" name="institution" required>
                    </div>
                    <div class="form-group">
                        <label for="course-name">Curso/Certificación *</label>
                        <input type="text" id="course-name" name="course_name" required>
                    </div>
                    <div class="form-group">
                        <label for="certificate-url">URL del Certificado</label>
                        <input type="url" id="certificate-url" name="certificate_url">
                    </div>
                `;
                break;

            default:
                fieldsHTML = '<p class="form-hint">Selecciona un tipo de experiencia para ver los campos específicos</p>';
        }

        dynamicFields.innerHTML = fieldsHTML;
    }

    // Configurar handlers de eventos
    setupEventListeners() {
        // Cerrar modal
        document.getElementById('experience-modal-close').addEventListener('click', () => this.close());
        document.getElementById('experience-cancel-btn').addEventListener('click', () => this.close());

        // Submit del formulario
        document.getElementById('experience-form').addEventListener('submit', (e) => this.handleSubmit(e));

        // Cerrar al hacer click fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Manejar checkbox "actual"
        document.getElementById('experience-current').addEventListener('change', (e) => {
            document.getElementById('experience-end-date').disabled = e.target.checked;
            if (e.target.checked) {
                document.getElementById('experience-end-date').value = '';
            }
        });
    }

    // Handler para cambio de tipo
    setupTypeChangeHandler() {
        document.getElementById('experience-type').addEventListener('change', (e) => {
            this.updateDynamicFields(e.target.value);
            
            // Mostrar/ocultar sección de enlaces para freelance
            const linksSection = document.getElementById('project-links-section');
            if (e.target.value === 'freelance') {
                linksSection.style.display = 'block';
            } else {
                linksSection.style.display = 'none';
            }
        });
    }

    // Handler para tags de tecnologías
    setupTagsHandler() {
        const tagsInput = document.getElementById('experience-technologies');
        const tagsList = document.getElementById('technologies-tags');

        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag) {
                    this.addTechnologyTag(tag);
                    tagsInput.value = '';
                }
            }
        });

        // Eliminar tags
        tagsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                e.target.parentElement.remove();
            }
        });
    }

    // Agregar tag de tecnología
    addTechnologyTag(tag) {
        const tagsList = document.getElementById('technologies-tags');
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="tag-remove">
                <i class="fas fa-times"></i>
            </span>
        `;
        tagsList.appendChild(tagElement);
    }

    // Obtener tecnologías como array
    getTechnologies() {
        const tags = document.querySelectorAll('#technologies-tags .tag');
        return Array.from(tags).map(tag => tag.textContent.trim().replace('×', ''));
    }

    // Handler para enlaces de proyectos
    setupProjectLinksHandler() {
        document.getElementById('add-project-link').addEventListener('click', () => {
            this.addProjectLinkInput();
        });
    }

    addProjectLinkInput(link = '') {
        const container = document.getElementById('project-links-container');
        const linkGroup = document.createElement('div');
        linkGroup.className = 'link-input-group';
        linkGroup.innerHTML = `
            <input type="url" 
                   class="project-link-input" 
                   placeholder="https://tuproyecto.com"
                   value="${link}">
            <button type="button" class="btn-remove-link">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(linkGroup);

        // Configurar eliminar
        linkGroup.querySelector('.btn-remove-link').addEventListener('click', () => {
            linkGroup.remove();
        });
    }

    renderProjectLinks(links) {
        const container = document.getElementById('project-links-container');
        container.innerHTML = '';
        links.forEach(link => this.addProjectLinkInput(link));
    }

    getProjectLinks() {
        const inputs = document.querySelectorAll('.project-link-input');
        return Array.from(inputs)
            .map(input => input.value.trim())
            .filter(link => link !== '');
    }

    // Manejar envío del formulario
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        if (this.validateForm(formData)) {
            await this.saveExperience(formData);
        }
    }

    // Obtener datos del formulario
    getFormData() {
        const type = document.getElementById('experience-type').value;
        
        // Convertir YYYY-MM a YYYY-MM-DD
        const startDateInput = document.getElementById('experience-start-date').value;
        const endDateInput = document.getElementById('experience-current').checked ? 
            null : document.getElementById('experience-end-date').value;
        
        const baseData = {
            type: type,
            start_date: startDateInput ? startDateInput + '-01' : null, // Agregar día 01
            end_date: endDateInput ? endDateInput + '-01' : null, // Agregar día 01
            current: document.getElementById('experience-current').checked,
            modality: document.getElementById('experience-modality').value,
            achievements: document.getElementById('experience-achievements').value,
            technologies: this.getTechnologies(),
            project_links: this.getProjectLinks()
        };

        // Agregar campos específicos del tipo
        switch (type) {
            case 'work':
                baseData.company = document.getElementById('company-name').value;
                baseData.title = document.getElementById('job-title').value;
                break;
            case 'freelance':
                baseData.client = document.getElementById('client-name').value;
                baseData.role = document.getElementById('project-role').value;
                break;
            case 'personal':
                baseData.project_name = document.getElementById('project-name').value;
                baseData.project_url = document.getElementById('project-url').value;
                break;
            case 'volunteer':
                baseData.organization = document.getElementById('organization-name').value;
                baseData.role = document.getElementById('volunteer-role').value;
                break;
            case 'education':
                baseData.institution = document.getElementById('institution-name').value;
                baseData.course_name = document.getElementById('course-name').value;
                baseData.certificate_url = document.getElementById('certificate-url').value;
                break;
        }

        // Si estamos editando, agregar ID
        if (this.isEditing && this.currentExperience.id) {
            baseData.id = this.currentExperience.id;
        }

        return baseData;
    }

    // Validar formulario
    validateForm(data) {
        if (!data.type) {
            alert('Por favor selecciona un tipo de experiencia');
            return false;
        }

        if (!data.start_date) {
            alert('La fecha de inicio es requerida');
            return false;
        }

        // Validaciones específicas por tipo
        switch (data.type) {
            case 'work':
                if (!data.company || !data.title) {
                    alert('Empresa y puesto son requeridos para trabajo tradicional');
                    return false;
                }
                break;
            case 'freelance':
                if (!data.client || !data.role) {
                    alert('Cliente y rol son requeridos para proyectos freelance');
                    return false;
                }
                break;
            case 'personal':
                if (!data.project_name) {
                    alert('El nombre del proyecto es requerido');
                    return false;
                }
                break;
            case 'volunteer':
                if (!data.organization || !data.role) {
                    alert('Organización y rol/causa son requeridos para voluntariado');
                    return false;
                }
                break;
            case 'education':
                if (!data.institution || !data.course_name) {
                    alert('Institución y curso son requeridos para educación');
                    return false;
                }
                break;
        }

        return true;
    }

    // Guardar experiencia
 // En saveExperience() - corregir variable
async saveExperience(data) {
    const saveBtn = document.getElementById('experience-save-btn');
    const originalText = saveBtn.textContent; // 🔥 DEFINIR AQUÍ
    
    try {
        // Mostrar loading
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveBtn.disabled = true;

        // Aquí se integrará con experience-manager.js
        if (window.experienceManager) {
            await window.experienceManager.saveExperience(data);
            this.close();
        } else {
            console.log('Datos de experiencia:', data);
            alert('Experiencia guardada (integration pending)');
            this.close();
        }

    } catch (error) {
        console.error('Error guardando experiencia:', error);
        alert('Error al guardar la experiencia: ' + error.message);
        
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

    // Mostrar modal
    showModal() {
        this.modal.style.display = 'flex';
        setTimeout(() => {
            this.modal.classList.add('active');
        }, 10);
    }

    // Cerrar modal
    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
                this.currentExperience = null;
                this.isEditing = false;
            }, 300);
        }
    }
}

// Inicializar y exportar
window.ExperienceModal = ExperienceModal;