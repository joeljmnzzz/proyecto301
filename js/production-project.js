// production-project.js - VERSIÓN ACTUALIZADA CON NUEVO SISTEMA DE TAREAS

// Variables globales
let currentProjectId = null;
let currentProjectData = null;
let projectMembers = [];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    await initializeDashboard();
    setupEventListeners();
});

// Inicializar el dashboard
async function initializeDashboard() {
    // Obtener el ID del proyecto actual
    currentProjectId = getCurrentProjectId();
    
    if (!currentProjectId) {
        console.error('No se pudo obtener el ID del proyecto');
        showError('No se pudo cargar el proyecto. Por favor, accede desde la página del proyecto.');
        return;
    }

    try {
        // Verificar acceso al proyecto primero
        const hasAccess = await verifyProjectAccess(currentProjectId);
        if (!hasAccess) {
            showError('No tienes acceso a este proyecto');
            return;
        }

        // Cargar datos del proyecto
        await loadProjectData();
        
        // INICIALIZAR EL GESTOR DE TAREAS
        await taskManager.initialize(currentProjectId);
        
        // Cargar datos iniciales
        await Promise.all([
            loadProjectMembers(),
            loadTasks(),
            loadChatMessages(),
            loadRecentActivity()
        ]);

        // Actualizar UI con datos del proyecto
        updateProjectUI();

    } catch (error) {
        console.error('Error inicializando dashboard:', error);
        showError('Error al cargar los datos del proyecto');
    }
}

// CARGAR MIEMBROS DEL PROYECTO - VERSIÓN ACTUALIZADA
async function loadProjectMembers() {
    try {
        // PRIMERO: Obtener los user_ids de los miembros
        const { data: members, error: membersError } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', currentProjectId)
            .eq('is_active', true);

        if (membersError) {
            console.error('Error cargando miembros:', membersError);
            throw membersError;
        }

        console.log('👥 Miembros encontrados:', members);

        if (!members || members.length === 0) {
            projectMembers = [];
            updateMembersUI();
            console.log('ℹ️ No hay miembros en este proyecto');
            return;
        }

        // SEGUNDO: Obtener información de perfiles por separado
        const userIds = members.map(member => member.user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error cargando perfiles:', profilesError);
            throw profilesError;
        }

        console.log('👤 Perfiles cargados:', profiles);

        // COMBINAR: Unir la información de miembros con perfiles
        projectMembers = members.map(member => {
            const profile = profiles?.find(p => p.id === member.user_id);
            return {
                user_id: member.user_id,
                role: member.role,
                profiles: profile || { 
                    username: 'Usuario', 
                    full_name: 'Usuario', 
                    avatar_url: null 
                }
            };
        });

        console.log('✅ Miembros combinados:', projectMembers);
        updateMembersUI();
        
    } catch (error) {
        console.error('Error loading project members:', error);
        showError('Error al cargar los miembros del proyecto');
    }
}

// Actualizar UI de miembros (dropdown y avatares)
function updateMembersUI() {
    // Actualizar dropdown en el gestor de tareas
    taskManager.updateMembersDropdown(projectMembers);
    
    // Actualizar usuarios activos en el chat
    updateActiveUsers();
}

// Actualizar usuarios activos en el chat
function updateActiveUsers() {
    const usersCount = document.getElementById('active-users-count');
    const usersAvatars = document.getElementById('users-avatars');
    
    if (!usersCount || !usersAvatars) return;
    
    usersCount.textContent = `${projectMembers.length} miembros activos`;
    usersAvatars.innerHTML = '';
    
    projectMembers.slice(0, 5).forEach(member => {
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.title = member.profiles.full_name || member.profiles.username;
        
        if (member.profiles.avatar_url) {
            avatar.style.backgroundImage = `url(${member.profiles.avatar_url})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        usersAvatars.appendChild(avatar);
    });
}

// Configurar event listeners - VERSIÓN ACTUALIZADA
function setupEventListeners() {
    // Botón para agregar tarea
    const addTaskBtn = document.getElementById('btn-add-task');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openTaskModal);
    }
    
    // Modal de tarea
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.btn-cancel');
    const taskForm = document.getElementById('task-form');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeTaskModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);
    if (taskForm) taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Modales de etiquetas
    const tagModal = document.getElementById('tag-modal');
    const closeTagModalBtn = tagModal?.querySelector('.close-modal');
    const cancelTagBtn = tagModal?.querySelector('.btn-cancel');
    
    if (closeTagModalBtn) closeTagModalBtn.addEventListener('click', () => taskManager.closeTagModal());
    if (cancelTagBtn) cancelTagBtn.addEventListener('click', () => taskManager.closeTagModal());
    if (tagModal) {
        tagModal.addEventListener('click', function(e) {
            if (e.target === tagModal) {
                taskManager.closeTagModal();
            }
        });
    }

    // Chat
    const sendMessageBtn = document.getElementById('btn-send-message');
    const messageInput = document.getElementById('message-input');
    
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTaskModal();
            }
        });
    }

    // Navegación entre pestañas
    setupNavigationListeners();
}

// Modal functions - VERSIÓN ACTUALIZADA
function openTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('task-title').focus();
        // Limpiar el formulario al abrir
        taskManager.resetForm();
    }
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('task-form').reset();
        taskManager.resetForm();
    }
}

// Manejar envío de formulario de tarea - VERSIÓN COMPLETAMENTE ACTUALIZADA
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        
        const formData = new FormData(e.target);
        
        // Validar formulario usando el TaskManager
        const validationErrors = taskManager.validateTaskForm(formData);
        if (validationErrors.length > 0) {
            taskManager.showValidationError(validationErrors[0]);
            return;
        }

        // Obtener datos del formulario
        const taskData = await taskManager.getTaskFormData(formData);
        
        // Crear la tarea con todas las relaciones
        const task = await createTaskWithRelations(taskData);
        
        if (task) {
            await loadTasks(); // Recargar tareas
            closeTaskModal();
            showSuccess('Tarea creada exitosamente');
            
            // Agregar al timeline
            await addToTimeline(
                currentProjectId, 
                'task_created', 
                `Nueva tarea creada: ${taskData.title}`, 
                taskData.created_by, 
                { 
                    task_id: task.id, 
                    task_title: taskData.title,
                    assignees_count: taskData.assignees.length,
                    tags_count: taskData.tags.length
                }
            );
        }
        
    } catch (error) {
        console.error('Error creating task:', error);
        showError('Error al crear la tarea: ' + error.message);
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
    }
}

// Crear tarea con relaciones - NUEVA FUNCIÓN
async function createTaskWithRelations(taskData) {
    const { assignees, tags, ...taskMainData } = taskData;
    
    try {
        // 1. Crear la tarea principal
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert([taskMainData])
            .select()
            .single();

        if (taskError) throw taskError;

        console.log('✅ Tarea principal creada:', task);

        // 2. Crear asignaciones múltiples si existen
        if (assignees && assignees.length > 0) {
            const assigneesData = assignees.map(userId => ({
                task_id: task.id,
                user_id: userId,
                assigned_by: taskMainData.created_by
            }));

            const { error: assigneesError } = await supabase
                .from('task_assignees')
                .insert(assigneesData);

            if (assigneesError) throw assigneesError;
            console.log('✅ Asignaciones creadas:', assigneesData);
        }

        // 3. Agregar etiquetas si existen
        if (tags && tags.length > 0) {
            const tagsData = tags.map(tagId => ({
                task_id: task.id,
                tag_id: tagId
            }));

            const { error: tagsError } = await supabase
                .from('task_tags')
                .insert(tagsData);

            if (tagsError) throw tagsError;
            console.log('✅ Etiquetas agregadas:', tagsData);
        }

        return task;

    } catch (error) {
        console.error('Error creando tarea con relaciones:', error);
        throw error;
    }
}

// CARGAR TAREAS - VERSIÓN COMPLETAMENTE ACTUALIZADA
async function loadTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    try {
        // PRIMERO: Obtener las tareas básicas
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', currentProjectId)
            .order('created_at', { ascending: false });

        if (tasksError) {
            console.error('Error cargando tareas:', tasksError);
            throw tasksError;
        }

        console.log('📋 Tareas encontradas:', tasks);

        if (!tasks || tasks.length === 0) {
            renderTasks([]);
            return;
        }

        // SEGUNDO: Obtener información relacionada en paralelo
        const taskIds = tasks.map(task => task.id);
        
        const [
            { data: assignees, error: assigneesError },
            { data: taskTags, error: tagsError },
            { data: attachments, error: attachmentsError },
            { data: userProfiles, error: profilesError }
        ] = await Promise.all([
            // Asignados
            supabase
                .from('task_assignees')
                .select('task_id, user_id')
                .in('task_id', taskIds),
            
            // Etiquetas
            supabase
                .from('task_tags')
                .select('task_id, tags(id, name, color)')
                .in('task_id', taskIds),
            
            // Archivos adjuntos
            supabase
                .from('task_attachments')
                .select('task_id')
                .in('task_id', taskIds),
            
            // Perfiles de usuarios (para creadores y asignados)
            supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', [...new Set([
                    ...tasks.map(t => t.created_by),
                    ...tasks.map(t => t.assigned_to).filter(id => id)
                ])])
        ]);

        // Manejar errores de consultas relacionadas
        if (assigneesError) console.error('Error cargando asignados:', assigneesError);
        if (tagsError) console.error('Error cargando etiquetas:', tagsError);
        if (attachmentsError) console.error('Error cargando adjuntos:', attachmentsError);
        if (profilesError) console.error('Error cargando perfiles:', profilesError);

        // TERCERO: Combinar toda la información
        const tasksWithDetails = tasks.map(task => {
            // Asignados múltiples
            const taskAssignees = (assignees || [])
                .filter(a => a.task_id === task.id)
                .map(a => {
                    const profile = (userProfiles || []).find(p => p.id === a.user_id);
                    return profile || { id: a.user_id, username: 'Usuario', full_name: 'Usuario', avatar_url: null };
                });

            // Etiquetas
            const taskTagsData = (taskTags || [])
                .filter(tt => tt.task_id === task.id)
                .map(tt => tt.tags)
                .filter(tag => tag); // Filtrar tags nulos

            // Archivos adjuntos
            const taskAttachments = (attachments || [])
                .filter(att => att.task_id === task.id);

            // Creador
            const creator = (userProfiles || []).find(p => p.id === task.created_by) || 
                           { username: 'Usuario', full_name: 'Usuario', avatar_url: null };

            return {
                ...task,
                assignees: taskAssignees,
                tags: taskTagsData,
                attachments: taskAttachments,
                created_by: creator,
                // Mantener compatibilidad con versión anterior
                assigned_to: taskAssignees.length > 0 ? taskAssignees[0] : null
            };
        });

        console.log('✅ Tareas combinadas con detalles:', tasksWithDetails);
        renderTasks(tasksWithDetails);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasksContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las tareas</p>
                <button onclick="loadTasks()" class="btn-retry">Reintentar</button>
            </div>
        `;
    }
}

// Renderizar tareas en el HTML - VERSIÓN ACTUALIZADA
function renderTasks(tasks) {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No hay tareas creadas</p>
                <button class="btn-primary" onclick="openTaskModal()">Crear primera tarea</button>
            </div>
        `;
        return;
    }

    tasksContainer.innerHTML = tasks.map(task => `
        <article class="task-card priority-${task.priority} status-${task.status}" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="task-priority-badge ${task.priority}">${getPriorityLabel(task.priority)}</span>
            </div>
            
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            
            <!-- Etiquetas -->
            ${task.tags && task.tags.length > 0 ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `
                        <span class="task-tag" style="background-color: ${tag.color}">${tag.name}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="task-meta">
                <!-- Asignados múltiples -->
                <div class="task-assignees">
                    ${task.assignees && task.assignees.length > 0 ? `
                        <div class="assignees-list">
                            ${task.assignees.slice(0, 3).map(assignee => `
                                <div class="assignee-avatar" title="${assignee.full_name || assignee.username}">
                                    ${assignee.avatar_url ? 
                                        `<img src="${assignee.avatar_url}" alt="${assignee.full_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                        `<i class="fas fa-user"></i>`
                                    }
                                </div>
                            `).join('')}
                            ${task.assignees.length > 3 ? `
                                <div class="more-assignees">+${task.assignees.length - 3}</div>
                            ` : ''}
                        </div>
                    ` : '<span class="no-assignee">Sin asignar</span>'}
                </div>
                
                <div class="task-dates">
                    ${task.estimated_hours ? `
                        <div class="task-estimation">
                            <i class="far fa-clock"></i>
                            ${task.estimated_hours}h
                        </div>
                    ` : ''}
                    ${task.due_date ? `
                        <div class="task-due-date ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}">
                            <i class="far fa-calendar"></i>
                            ${formatDate(task.due_date)}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="task-footer">
                <span class="task-status-badge ${task.status}">${getStatusLabel(task.status)}</span>
                
                ${task.attachments && task.attachments.length > 0 ? `
                    <div class="task-attachments-indicator">
                        <i class="fas fa-paperclip"></i>
                        <span>${task.attachments.length}</span>
                    </div>
                ` : ''}
                
                <button class="btn-task-options" onclick="showTaskOptions('${task.id}')">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
        </article>
    `).join('');
}

// Exportar funciones para uso global
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.loadTasks = loadTasks;
window.showTaskOptions = showTaskOptions;