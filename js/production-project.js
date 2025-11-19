// production-tasks.js
// Manejo de tareas para Proyecto301 - VERSIÓN MEJORADA

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

// ✅ NUEVO: Verificar acceso al proyecto
async function verifyProjectAccess(projectId) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('🔐 Usuario no autenticado');
            return false;
        }

        // Verificar si el usuario es miembro del proyecto
        const { data: membership, error } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (error) {
            console.log('❌ Usuario no tiene acceso al proyecto:', error.message);
            return false;
        }

        console.log('✅ Usuario tiene acceso al proyecto');
        return true;

    } catch (error) {
        console.error('Error verificando acceso:', error);
        return false;
    }
}

// ✅ NUEVO: Cargar datos del proyecto
async function loadProjectData() {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', currentProjectId)
            .single();

        if (error) throw error;

        currentProjectData = project;
        console.log('✅ Datos del proyecto cargados:', project);

    } catch (error) {
        console.error('Error cargando datos del proyecto:', error);
        throw error;
    }
}

// ✅ NUEVO: Actualizar UI con datos del proyecto
function updateProjectUI() {
    if (!currentProjectData) return;

    // Actualizar título de la página
    document.title = `${currentProjectData.title} - Producción | Proyecto 301`;

    // Actualizar navegación activa basada en la URL
    updateActiveNavigation();
}

// ✅ NUEVO: Actualizar navegación activa
function updateActiveNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;
    
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Determinar qué pestaña está activa basada en la URL o parámetros
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || 'tasks';
    
    const activeNavItem = document.getElementById(`nav-${activeTab}`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// Configurar event listeners
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

    // ✅ NUEVO: Navegación entre pestañas
    setupNavigationListeners();
}

// ✅ NUEVO: Configurar listeners de navegación
function setupNavigationListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover activo de todos los items
            navItems.forEach(i => i.classList.remove('active'));
            
            // Agregar activo al item clickeado
            item.classList.add('active');
            
            // Obtener el tipo de navegación del ID
            const navType = item.id.replace('nav-', '');
            
            // Manejar la navegación
            handleNavigation(navType);
        });
    });
}

// ✅ NUEVO: Manejar navegación entre pestañas
function handleNavigation(navType) {
    console.log('Navegando a:', navType);
    
    // Actualizar URL sin recargar la página
    const newUrl = `${window.location.pathname}?project_id=${currentProjectId}&tab=${navType}`;
    window.history.pushState({}, '', newUrl);
    
    // Mostrar/ocultar secciones según la navegación
    switch (navType) {
        case 'project':
            showProjectOverview();
            break;
        case 'tasks':
            showTasksSection();
            break;
        case 'cloud':
            showCloudSection();
            break;
        case 'requests':
            showRequestsSection();
            break;
        case 'notifications':
            showNotificationsSection();
            break;
        default:
            showTasksSection();
    }
}

// ✅ NUEVAS FUNCIONES DE NAVEGACIÓN
function showProjectOverview() {
    // Ocultar todas las secciones
    hideAllSections();
    
    // Mostrar sección de proyecto
    const projectSection = document.getElementById('project-overview-section');
    if (projectSection) {
        projectSection.style.display = 'block';
    }
    
    // Cargar datos de overview del proyecto
    loadProjectOverview();
}

function showTasksSection() {
    hideAllSections();
    
    const tasksSection = document.getElementById('tasks-section');
    if (tasksSection) {
        tasksSection.style.display = 'block';
    }
    
    // Recargar tareas si es necesario
    loadTasks();
}

function showCloudSection() {
    hideAllSections();
    
    const cloudSection = document.getElementById('cloud-section');
    if (cloudSection) {
        cloudSection.style.display = 'block';
    }
    
    loadCloudFiles();
}

function showRequestsSection() {
    hideAllSections();
    
    const requestsSection = document.getElementById('requests-section');
    if (requestsSection) {
        requestsSection.style.display = 'block';
    }
    
    loadJoinRequests();
}

function showNotificationsSection() {
    hideAllSections();
    
    const notificationsSection = document.getElementById('notifications-section');
    if (notificationsSection) {
        notificationsSection.style.display = 'block';
    }
    
    loadNotifications();
}

function hideAllSections() {
    const sections = [
        'project-overview-section',
        'tasks-section', 
        'cloud-section',
        'requests-section',
        'notifications-section'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
}

// Obtener el ID del proyecto actual
function getCurrentProjectId() {
    // 1. Intentar obtener de la URL
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('project_id');
    
    // 2. Si no está en la URL, intentar obtener de sessionStorage
    if (!projectId) {
        projectId = sessionStorage.getItem('currentProjectId');
    }
    
    // 3. Si aún no hay proyecto, mostrar error
    if (!projectId) {
        console.error('❌ No se pudo obtener el ID del proyecto');
        return null;
    }
    
    console.log('✅ Project ID obtenido:', projectId);
    return projectId;
}

// Cargar miembros del proyecto
async function loadProjectMembers() {
    try {
        const { data, error } = await supabase
            .from('project_members')
            .select(`
                user_id,
                role,
                profiles!inner(full_name, avatar_url, username)
            `)
            .eq('project_id', currentProjectId)
            .eq('is_active', true);

        if (error) throw error;

        projectMembers = data || [];
        updateMembersDropdown();
        updateActiveUsers();
        
    } catch (error) {
        console.error('Error loading project members:', error);
        showError('Error al cargar los miembros del proyecto');
    }
}

// Actualizar dropdown de asignación
function updateMembersDropdown() {
    const assigneeSelect = document.getElementById('task-assignee');
    if (!assigneeSelect) return;
    
    assigneeSelect.innerHTML = '<option value="">Seleccionar miembro</option>';
    
    projectMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.user_id;
        option.textContent = member.profiles.full_name || member.profiles.username;
        assigneeSelect.appendChild(option);
    });
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

// Cargar tareas
async function loadTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                *,
                assigned_to:profiles!tasks_assigned_to_fkey(full_name, avatar_url, username),
                created_by:profiles!tasks_created_by_fkey(full_name, avatar_url, username),
                attachments:task_attachments(count)
            `)
            .eq('project_id', currentProjectId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderTasks(tasks || []);
        
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

// Renderizar tareas en el HTML
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
            
            <div class="task-meta">
                <div class="task-assignee">
                    ${task.assigned_to ? `
                        <div class="assignee-info">
                            <div class="assignee-avatar">
                                ${task.assigned_to.avatar_url ? 
                                    `<img src="${task.assigned_to.avatar_url}" alt="${task.assigned_to.full_name}">` : 
                                    `<i class="fas fa-user"></i>`
                                }
                            </div>
                            <span class="assignee-name">${task.assigned_to.full_name || task.assigned_to.username}</span>
                        </div>
                    ` : '<span class="no-assignee">Sin asignar</span>'}
                </div>
                
                <div class="task-dates">
                    ${task.due_date ? `
                        <div class="task-due-date ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}">
                            <i class="far fa-clock"></i>
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

// Funciones auxiliares
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getPriorityLabel(priority) {
    const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada',
        blocked: 'Bloqueada'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function isOverdue(dueDate, status) {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
}

// Modal functions
function openTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('task-title').focus();
    }
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('task-form').reset();
    }
}

// Manejar envío de formulario de tarea
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        submitBtn.disabled = true;
        
        const formData = new FormData(e.target);
        const currentUser = (await supabase.auth.getUser()).data.user;
        
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }
        
        const taskData = {
            project_id: currentProjectId,
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            assigned_to: formData.get('assigned_to') || null,
            priority: formData.get('priority'),
            due_date: formData.get('due_date') || null,
            created_by: currentUser.id,
            status: 'pending'
        };

        const task = await createTask(taskData);
        if (task) {
            await loadTasks(); // Recargar tareas
            closeTaskModal();
            showSuccess('Tarea creada exitosamente');
        }
        
    } catch (error) {
        console.error('Error creating task:', error);
        showError('Error al crear la tarea: ' + error.message);
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Crear nueva tarea
async function createTask(taskData) {
    const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

    if (error) throw error;

    // Agregar al timeline de actividad
    await addToTimeline(
        taskData.project_id, 
        'task_created', 
        `Nueva tarea creada: ${taskData.title}`, 
        taskData.created_by, 
        { task_id: data.id, task_title: taskData.title }
    );

    return data;
}

// Agregar evento al timeline
async function addToTimeline(projectId, actionType, description, performedBy, metadata = {}) {
    try {
        const { error } = await supabase
            .from('project_timeline')
            .insert([{
                project_id: projectId,
                action_type: actionType,
                description: description,
                performed_by: performedBy,
                metadata: metadata
            }]);

        if (error) throw error;
        
    } catch (error) {
        console.error('Error adding to timeline:', error);
    }
}

// Mostrar opciones de tarea
function showTaskOptions(taskId) {
    // Implementar menú de opciones para tarea (editar, eliminar, etc.)
    console.log('Mostrar opciones para tarea:', taskId);
}

// ✅ NUEVAS FUNCIONES PARA OTRAS SECCIONES
async function loadProjectOverview() {
    console.log('Cargando overview del proyecto...');
    // Implementar carga de datos generales del proyecto
}

async function loadCloudFiles() {
    console.log('Cargando archivos de la nube...');
    // Implementar carga de archivos
}

async function loadJoinRequests() {
    console.log('Cargando solicitudes de unión...');
    // Implementar carga de solicitudes
}

async function loadNotifications() {
    console.log('Cargando notificaciones...');
    // Implementar carga de notificaciones
}

// Cargar mensajes del chat
async function loadChatMessages() {
    console.log('Cargando mensajes del chat...');
    // Implementar carga de mensajes del chat
}

// Cargar actividad reciente
async function loadRecentActivity() {
    console.log('Cargando actividad reciente...');
    // Implementar carga de actividad
}

// Enviar mensaje
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (!currentUser) {
            showError('Debes iniciar sesión para enviar mensajes');
            return;
        }
        
        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                project_id: currentProjectId,
                sender_id: currentUser.id,
                message: message
            }]);
            
        if (error) throw error;
        
        // Limpiar input y recargar mensajes
        messageInput.value = '';
        await loadChatMessages();
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        showError('Error al enviar el mensaje');
    }
}

// Funciones de utilidad para mostrar mensajes
function showError(message) {
    // Implementar toast de error
    console.error('Error:', message);
    // Ejemplo simple de alerta
    alert(`❌ ${message}`);
}

function showSuccess(message) {
    // Implementar toast de éxito
    console.log('Éxito:', message);
    // Ejemplo simple de alerta
    alert(`✅ ${message}`);
}

// Exportar funciones para uso global
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.loadTasks = loadTasks;
window.showTaskOptions = showTaskOptions;