// auth-manager.js - Manejo de autenticación y sesión de usuario
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Verificar si hay sesión activa al cargar la página
        await this.checkCurrentSession();
        this.setupEventListeners();
    }

    // Verificar sesión actual
    async checkCurrentSession() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error) throw error;
            
            if (user) {
                await this.loadUserProfile(user.id);
                this.showUserMenu();
            } else {
                this.showLoginIcon();
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            this.showLoginIcon();
        }
    }

    // Cargar perfil del usuario desde la tabla profiles
    async loadUserProfile(userId) {
        try {
            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            this.currentUser = {
                ...profile,
                email: profile.email // O usar user.email del auth
            };

            this.updateUI();
            
        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    // Actualizar interfaz con datos del usuario
    updateUI() {
        // Navbar
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar && this.currentUser?.avatar_url) {
            userAvatar.src = this.currentUser.avatar_url;
        } else if (userAvatar) {
            userAvatar.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
        }
        
        if (userName && this.currentUser?.user_name) {
            userName.textContent = this.currentUser.user_name;
        }
    }

    // Mostrar menú de usuario
    showUserMenu() {
        const userMenuContainer = document.getElementById('user-menu-container');
        const loginIcon = document.getElementById('login-icon');
        
        if (userMenuContainer) userMenuContainer.style.display = 'flex';
        if (loginIcon) loginIcon.style.display = 'none';
    }

    // Mostrar icono de login
    showLoginIcon() {
        const userMenuContainer = document.getElementById('user-menu-container');
        const loginIcon = document.getElementById('login-icon');
        
        if (userMenuContainer) userMenuContainer.style.display = 'none';
        if (loginIcon) loginIcon.style.display = 'flex';
    }

    // Configurar event listeners
    setupEventListeners() {
        // Menú de usuario
        const userTrigger = document.getElementById('user-trigger');
        const userMenu = document.getElementById('user-menu');
        const logoutBtn = document.getElementById('logout-btn');

        if (userTrigger && userMenu) {
            userTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                userTrigger.parentElement.classList.toggle('active');
            });

            // Cerrar menú al hacer click fuera
            document.addEventListener('click', () => {
                userTrigger.parentElement.classList.remove('active');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.showLoginIcon();
            window.location.href = '../index.html';
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            alert('Error al cerrar sesión');
        }
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Inicializar AuthManager cuando Supabase esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        window.authManager = new AuthManager();
    } else {
        window.addEventListener('supabase-ready', () => {
            window.authManager = new AuthManager();
        });
    }
});