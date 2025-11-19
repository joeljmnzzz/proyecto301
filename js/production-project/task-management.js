// task-management.js - Gestión mejorada de tareas

class TaskManager {
    constructor() {
        this.currentProjectId = null;
        this.projectMembers = [];
        this.projectTags = [];
        this.selectedAssignees = [];
        this.selectedTags = [];
    }

    // Inicializar el gestor de tareas
    async initialize(projectId) {
        this.currentProjectId = projectId;
        await this.loadProjectTags();
        this.setupEventListeners();
    }

    // Cargar etiquetas del proyecto
    async loadProjectTags() {
        try {
            const { data: tags, error } = await supabase
                .from('tags')
                .select('*')
                .eq('project_id', this.currentProjectId)
                .order('name');

            if (error) throw error;

            this.projectTags = tags || [];
            this.updateTagsDropdown();
            console.log('✅ Etiquetas cargadas:', this.projectTags);

        } catch (error) {
            console.error('Error cargando etiquetas:', error);
        }
    }

    // Actualizar dropdown de etiquetas
    updateTagsDropdown() {
        const tagsSelect = document.getElementById('task-tags');
        if (!tagsSelect) return;

        // Limpiar opciones existentes (excepto la primera)
        tagsSelect.innerHTML = '<option value="">Seleccionar etiquetas...</option>';

        this.projectTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            option.dataset.color = tag.color;
            tagsSelect.appendChild(option);
        });
    }

    // Actualizar dropdown de miembros
    updateMembersDropdown(members) {
        this.projectMembers = members;
        const assigneesSelect = document.getElementById('task-assignees');
        if (!assigneesSelect) return;

        assigneesSelect.innerHTML = '<option value="">Seleccionar miembros...</option>';

        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.user_id;
            option.textContent = member.profiles.full_name || member.profiles.username;
            option.dataset.avatar = member.profiles.avatar_url;
            assigneesSelect.appendChild(option);
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Contadores de caracteres
        const titleInput = document.getElementById('task-title');
        const descriptionInput = document.getElementById('task-description');

        if (titleInput) {
            titleInput.addEventListener('input', this.updateCharCount.bind(this, 'title'));
        }
        if (descriptionInput) {
            descriptionInput.addEventListener('input', this.updateCharCount.bind(this, 'description'));
        }

        // Selectores múltiples
        const assigneesSelect = document.getElementById('task-assignees');
        const tagsSelect = document.getElementById('task-tags');

        if (assigneesSelect) {
            assigneesSelect.addEventListener('change', this.handleAssigneeSelect.bind(this));
        }
        if (tagsSelect) {
            tagsSelect.addEventListener('change', this.handleTagSelect.bind(this));
        }

        // Fecha límite
        const dueDateInput = document.getElementById('task-due-date');
        if (dueDateInput) {
            dueDateInput.addEventListener('change', this.updateDateHint.bind(this));
            // Establecer fecha mínima como hoy
            const today = new Date().toISOString().slice(0, 16);
            dueDateInput.min = today;
        }

        // Botón crear etiqueta
        const addTagBtn = document.getElementById('btn-add-tag');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', this.openTagModal.bind(this));
        }

        // Formulario de etiqueta
        const tagForm = document.getElementById('tag-form');
        if (tagForm) {
            tagForm.addEventListener('submit', this.handleTagSubmit.bind(this));
        }

        // Presets de color
        this.setupColorPresets();
    }

    // Actualizar contador de caracteres
    updateCharCount(field) {
        const input = document.getElementById(`task-${field}`);
        const counter = document.getElementById(`${field}-char-count`);
        
        if (input && counter) {
            const count = input.value.length;
            counter.textContent = count;
            
            // Cambiar color si se acerca al límite
            const maxLength = field === 'title' ? 200 : 1000;
            if (count > maxLength * 0.8) {
                counter.style.color = count > maxLength * 0.9 ? '#EF4444' : '#F59E0B';
            } else {
                counter.style.color = '#6B7280';
            }
        }
    }

    // Manejar selección de asignados
    handleAssigneeSelect(event) {
        const selectedOptions = Array.from(event.target.selectedOptions);
        
        selectedOptions.forEach(option => {
            if (option.value && !this.selectedAssignees.find(a => a.id === option.value)) {
                this.selectedAssignees.push({
                    id: option.value,
                    name: option.textContent,
                    avatar: option.dataset.avatar
                });
            }
        });

        // Limpiar selección
        event.target.selectedIndex = -1;
        this.updateSelectedAssigneesUI();
    }

    // Manejar selección de etiquetas
    handleTagSelect(event) {
        const selectedOptions = Array.from(event.target.selectedOptions);
        
        selectedOptions.forEach(option => {
            if (option.value && !this.selectedTags.find(t => t.id === option.value)) {
                const tag = this.projectTags.find(t => t.id === option.value);
                if (tag) {
                    this.selectedTags.push(tag);
                }
            }
        });

        // Limpiar selección
        event.target.selectedIndex = -1;
        this.updateSelectedTagsUI();
    }

    // Actualizar UI de asignados seleccionados
    updateSelectedAssigneesUI() {
        const container = document.getElementById('selected-assignees');
        if (!container) return;

        container.innerHTML = this.selectedAssignees.map(assignee => `
            <div class="assignee-chip">
                ${assignee.avatar ? 
                    `<img src="${assignee.avatar}" alt="${assignee.name}" onerror="this.style.display='none'">` : 
                    `<i class="fas fa-user"></i>`
                }
                <span>${assignee.name}</span>
                <button type="button" class="btn-remove-chip" data-id="${assignee.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // Agregar event listeners a los botones de eliminar
        container.querySelectorAll('.btn-remove-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.selectedAssignees = this.selectedAssignees.filter(a => a.id !== id);
                this.updateSelectedAssigneesUI();
            });
        });
    }

    // Actualizar UI de etiquetas seleccionadas
    updateSelectedTagsUI() {
        const container = document.getElementById('selected-tags');
        if (!container) return;

        container.innerHTML = this.selectedTags.map(tag => `
            <div class="tag-chip" style="--tag-color: ${tag.color}">
                <span>${tag.name}</span>
                <button type="button" class="btn-remove-chip" data-id="${tag.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // Agregar event listeners a los botones de eliminar
        container.querySelectorAll('.btn-remove-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.selectedTags = this.selectedTags.filter(t => t.id !== id);
                this.updateSelectedTagsUI();
            });
        });
    }

    // Actualizar hint de fecha
    updateDateHint() {
        const dateInput = document.getElementById('task-due-date');
        const hint = document.getElementById('date-hint');
        
        if (!dateInput || !hint) return;

        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        const diffTime = selectedDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            hint.textContent = '⚠️ La fecha no puede ser en el pasado';
            hint.style.color = '#EF4444';
        } else if (diffDays === 0) {
            hint.textContent = '📅 Hoy';
            hint.style.color = '#F59E0B';
        } else if (diffDays === 1) {
            hint.textContent = '📅 Mañana';
            hint.style.color = '#10B981';
        } else if (diffDays <= 7) {
            hint.textContent = `📅 En ${diffDays} días`;
            hint.style.color = '#10B981';
        } else {
            hint.textContent = `📅 En ${diffDays} días`;
            hint.style.color = '#6B7280';
        }
    }

    // Configurar presets de color
    setupColorPresets() {
        const presets = document.querySelectorAll('.color-preset');
        const colorInput = document.getElementById('tag-color');

        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                colorInput.value = color;
                
                // Actualizar estado activo
                presets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });
    }

    // Abrir modal de etiqueta
    openTagModal() {
        const modal = document.getElementById('tag-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('tag-name').focus();
        }
    }

    // Cerrar modal de etiqueta
    closeTagModal() {
        const modal = document.getElementById('tag-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('tag-form').reset();
        }
    }

    // Manejar envío de formulario de etiqueta
    async handleTagSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const currentUser = (await supabase.auth.getUser()).data.user;
        
        if (!currentUser) {
            this.showValidationError('Debes iniciar sesión para crear etiquetas');
            return;
        }

        const tagData = {
            project_id: this.currentProjectId,
            name: formData.get('name').trim(),
            color: formData.get('color'),
            created_by: currentUser.id
        };

        // Validación
        if (!tagData.name) {
            this.showValidationError('El nombre de la etiqueta es requerido');
            return;
        }

        if (tagData.name.length > 50) {
            this.showValidationError('El nombre no puede tener más de 50 caracteres');
            return;
        }

        try {
            const { data: tag, error } = await supabase
                .from('tags')
                .insert([tagData])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Violación de unique constraint
                    this.showValidationError('Ya existe una etiqueta con ese nombre en este proyecto');
                } else {
                    throw error;
                }
                return;
            }

            // Agregar a la lista local y actualizar UI
            this.projectTags.push(tag);
            this.updateTagsDropdown();
            this.closeTagModal();
            this.showValidationSuccess('Etiqueta creada exitosamente');

        } catch (error) {
            console.error('Error creando etiqueta:', error);
            this.showValidationError('Error al crear la etiqueta: ' + error.message);
        }
    }

    // Validar formulario de tarea
    validateTaskForm(formData) {
        const errors = [];

        // Validar título
        const title = formData.get('title').trim();
        if (!title) {
            errors.push('El título es requerido');
        } else if (title.length > 200) {
            errors.push('El título no puede tener más de 200 caracteres');
        }

        // Validar descripción
        const description = formData.get('description').trim();
        if (description.length > 1000) {
            errors.push('La descripción no puede tener más de 1000 caracteres');
        }

        // Validar fecha
        const dueDate = formData.get('due_date');
        if (dueDate && new Date(dueDate) < new Date()) {
            errors.push('La fecha límite no puede ser en el pasado');
        }

        // Validar estimación
        const estimatedHours = formData.get('estimated_hours');
        if (estimatedHours && (estimatedHours < 1 || estimatedHours > 500)) {
            errors.push('La estimación debe estar entre 1 y 500 horas');
        }

        return errors;
    }

    // Mostrar error de validación
    showValidationError(message) {
        const validationEl = document.getElementById('form-validation');
        if (validationEl) {
            validationEl.className = 'form-validation error';
            validationEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
    }

    // Mostrar éxito de validación
    showValidationSuccess(message) {
        const validationEl = document.getElementById('form-validation');
        if (validationEl) {
            validationEl.className = 'form-validation success';
            validationEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            setTimeout(() => {
                validationEl.style.display = 'none';
            }, 3000);
        }
    }

    // Limpiar validación
    clearValidation() {
        const validationEl = document.getElementById('form-validation');
        if (validationEl) {
            validationEl.style.display = 'none';
        }
    }

    // Resetear formulario
    resetForm() {
        this.selectedAssignees = [];
        this.selectedTags = [];
        this.updateSelectedAssigneesUI();
        this.updateSelectedTagsUI();
        this.clearValidation();
        
        // Resetear contadores
        this.updateCharCount('title');
        this.updateCharCount('description');
    }

    // Obtener datos del formulario para enviar
    async getTaskFormData(formData) {
        const currentUser = (await supabase.auth.getUser()).data.user;
        
        return {
            project_id: this.currentProjectId,
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            priority: formData.get('priority'),
            due_date: formData.get('due_date') || null,
            estimated_hours: formData.get('estimated_hours') ? parseInt(formData.get('estimated_hours')) : null,
            created_by: currentUser.id,
            status: 'pending',
            // Datos para relaciones
            assignees: this.selectedAssignees.map(a => a.id),
            tags: this.selectedTags.map(t => t.id)
        };
    }
}

// Instancia global del gestor de tareas
const taskManager = new TaskManager();

// Exportar para uso global
window.taskManager = taskManager;