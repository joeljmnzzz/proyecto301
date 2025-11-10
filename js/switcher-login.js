// switcher-login.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Switcher Login cargado');
    
    // Esperar a que las traducciones estén cargadas
    if (!window.translations) {
        setTimeout(() => {
            document.dispatchEvent(new Event('DOMContentLoaded'));
        }, 100);
        return;
    }

    initializeFormSwitcher();
    initializeFormHandlers();
});

function initializeFormSwitcher() {
    const switchLinks = document.querySelectorAll('.switch-form');
    
    switchLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetForm = this.getAttribute('data-form');
            switchForm(targetForm);
        });
    });

    // ✅ CORREGIDO: Botón para omitir perfil - SOLO SI ESTÁ AUTENTICADO
    const skipProfileBtn = document.getElementById('skip-profile-btn');
    if (skipProfileBtn) {
        skipProfileBtn.addEventListener('click', async function() {
            console.log('⏭️ Intentando omitir perfil...');
            if (window.authManager) {
                await authManager.skipProfileCompletion();
            } else {
                console.error('❌ AuthManager no disponible');
            }
        });
    }
}

function switchForm(formType) {
    const loginContainer = document.getElementById('login-form-container');
    const registerBasicContainer = document.getElementById('register-basic-container');
    const registerCompleteContainer = document.getElementById('register-complete-container');
    
    // Ocultar todos los formularios primero
    loginContainer.style.display = 'none';
    registerBasicContainer.style.display = 'none';
    registerCompleteContainer.style.display = 'none';
    
    // Mostrar el formulario correspondiente
    if (formType === 'login') {
        loginContainer.style.display = 'block';
        console.log('🔁 Cambiando a formulario de login');
    } else if (formType === 'register-basic') {
        registerBasicContainer.style.display = 'block';
        console.log('🔁 Cambiando a formulario de registro básico');
    } else if (formType === 'register-complete') {
        registerCompleteContainer.style.display = 'block';
        console.log('🔁 Cambiando a formulario de registro completo');
    }
    
    // Limpiar mensajes anteriores
    clearMessages();
}

function initializeFormHandlers() {
    // Manejar envío del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Manejar envío del formulario de registro básico
    const registerBasicForm = document.getElementById('register-basic-form');
    if (registerBasicForm) {
        registerBasicForm.addEventListener('submit', handleRegisterBasicSubmit);
    }
    
    // ✅ CORREGIDO: Manejar envío del formulario de registro completo
    const registerCompleteForm = document.getElementById('register-complete-form');
    if (registerCompleteForm) {
        registerCompleteForm.addEventListener('submit', handleRegisterCompleteSubmit);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('🔐 Procesando login...');
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (window.authManager) {
        await authManager.loginUser(email, password);
    } else {
        console.error('❌ AuthManager no disponible');
    }
}

// ✅ CORREGIDO: Manejar registro básico (Paso 1) - SIN LOGIN AUTOMÁTICO
async function handleRegisterBasicSubmit(e) {
    e.preventDefault();
    console.log('📝 Procesando registro básico...');
    
    const formData = new FormData(e.target);
    const userData = {
        // Datos básicos de autenticación
        name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    console.log('📋 Datos del registro básico:', userData);
    
    if (window.authManager) {
        // ✅ CORREGIDO: Guardar credenciales temporalmente para login posterior
        window.tempUserCredentials = {
            email: userData.email,
            password: userData.password,
            name: userData.name
        };
        
        await authManager.registerBasicUser(userData);
    } else {
        console.error('❌ AuthManager no disponible');
    }
}

// ✅ CORREGIDO: Manejar registro completo (Paso 2) - SOLO SI ESTÁ AUTENTICADO
async function handleRegisterCompleteSubmit(e) {
    e.preventDefault();
    console.log('📝 Procesando registro completo...');
    
    const formData = new FormData(e.target);
    const profileData = {
        profession: formData.get('profession'),
        age: formData.get('age') ? parseInt(formData.get('age')) : null,
        main_interest: formData.get('main_interest'),
        location: formData.get('location'),
        bio: formData.get('bio'),
        skills: formData.get('skills') ? 
                formData.get('skills').split(',').map(skill => skill.trim()).filter(skill => skill !== '') 
                : []
    };
    
    console.log('📋 Datos del perfil:', profileData);
    
    if (window.authManager) {
        await authManager.completeUserProfile(profileData);
    } else {
        console.error('❌ AuthManager no disponible');
    }
}

// ✅ CORREGIDO: Mostrar formulario de registro completo - CON MEJOR MANEJO DE ERRORES
async function showCompleteRegistrationForm(userEmail) {
    console.log('🎯 Mostrando formulario de registro completo para:', userEmail);
    
    try {
        // ✅ NUEVO: Verificar autenticación antes de mostrar el formulario
        if (window.authManager) {
            const authCheck = await authManager.checkAuthAndVerification();
            
            if (!authCheck.success) {
                console.log('❌ No se puede mostrar formulario completo:', authCheck.message);
                
                // Mostrar mensaje de error
                authManager.showError(authCheck.message);
                
                // Si hay error de autenticación, limpiar y volver al login
                if (authCheck.message.includes('Sesión inválida') || authCheck.message.includes('Error de autenticación')) {
                    setTimeout(() => {
                        switchForm('login');
                        authManager.showInfo('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                    }, 2000);
                } else {
                    // Si no está autenticado, volver al login
                    setTimeout(() => {
                        switchForm('login');
                        authManager.showInfo('Por favor inicia sesión para completar tu perfil.');
                    }, 2000);
                }
                return;
            }
        }
        
        // Actualizar el email del usuario en el formulario
        const userEmailElement = document.getElementById('registered-user-email');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail;
        }
        
        // Cambiar al formulario de registro completo
        switchForm('register-complete');
        
        // Mostrar mensaje informativo
        if (window.authManager) {
            authManager.showSuccess('¡Ahora puedes completar tu perfil! (Opcional)');
        }
        
    } catch (error) {
        console.error('❌ Error inesperado en showCompleteRegistrationForm:', error);
        
        // En caso de error inesperado, volver al login
        setTimeout(() => {
            switchForm('login');
            if (window.authManager) {
                authManager.showError('Error inesperado. Por favor inicia sesión nuevamente.');
            }
        }, 2000);
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar formulario de login (para uso desde auth.js)
function showLoginForm() {
    console.log('🔁 Volviendo al formulario de login');
    switchForm('login');
    
    // Limpiar credenciales temporales si existen
    if (window.tempUserCredentials) {
        console.log('🗑️ Limpiando credenciales temporales');
        delete window.tempUserCredentials;
    }
    
    // Mostrar mensaje informativo
    if (window.authManager) {
        authManager.showInfo('Por favor verifica tu email e inicia sesión para continuar.');
    }
}

// ✅ NUEVA FUNCIÓN: Manejar sesión expirada o inválida
function handleInvalidSession(message = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.') {
    console.log('🔐 Manejando sesión inválida:', message);
    
    // Cambiar al formulario de login
    switchForm('login');
    
    // Limpiar credenciales temporales
    if (window.tempUserCredentials) {
        delete window.tempUserCredentials;
    }
    
    // Mostrar mensaje de error
    if (window.authManager) {
        authManager.showError(message);
    }
}

// ✅ NUEVA FUNCIÓN: Verificar estado de autenticación al cargar la página
async function checkAuthStateOnLoad() {
    try {
        console.log('🔍 Verificando estado de autenticación al cargar...');
        
        if (window.authManager && window.supabase) {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error) {
                console.log('❌ Error verificando autenticación:', error);
                // No hacer nada, dejar en formulario de login
                return;
            }
            
            if (user) {
                console.log('✅ Usuario autenticado detectado:', user.email);
                // El authManager manejará la redirección automáticamente
            } else {
                console.log('🔐 No hay usuario autenticado, mostrando login');
                switchForm('login');
            }
        }
    } catch (error) {
        console.error('❌ Error verificando estado de autenticación:', error);
        // En caso de error, mostrar formulario de login
        switchForm('login');
    }
}

function clearMessages() {
    const messageContainers = document.querySelectorAll('.message-container');
    messageContainers.forEach(container => {
        container.innerHTML = '';
    });
}

// Ejecutar verificación de autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(() => {
        checkAuthStateOnLoad();
    }, 500);
});

// Hacer las funciones disponibles globalmente
window.switchForm = switchForm;
window.showCompleteRegistrationForm = showCompleteRegistrationForm;
window.showLoginForm = showLoginForm;
window.handleInvalidSession = handleInvalidSession; // ✅ NUEVA: Para manejo de sesiones inválidas