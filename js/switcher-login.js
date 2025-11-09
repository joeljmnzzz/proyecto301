// switcher-login.js - Sistema de alternancia entre login y registro con animaciones
document.addEventListener('DOMContentLoaded', function() {
    // Estados
    let isLoginMode = true;
    let isAnimating = false;
    
    // Función para inicializar o reinicializar los event listeners
    function initializeSwitcher() {
        const loginBox = document.querySelector('.login-box');
        if (!loginBox) return;
        
        const switchLink = loginBox.querySelector('a[data-key="login.registrate"], a[data-key="register.iniciaSesion"]');
        const loginForm = loginBox.querySelector('form');
        
        if (!switchLink) return;
        
        // Remover event listeners anteriores para evitar duplicados
        const newSwitchLink = switchLink.cloneNode(true);
        switchLink.parentNode.replaceChild(newSwitchLink, switchLink);
        
        // Agregar event listener al nuevo enlace
        newSwitchLink.addEventListener('click', handleSwitchClick);
        
        // También para el formulario - solo prevenir envío por defecto
        if (loginForm) {
            loginForm.removeEventListener('submit', handleFormSubmit);
            loginForm.addEventListener('submit', handleFormSubmit);
        }
    }
    
    // Manejar el clic en el enlace de alternancia
    function handleSwitchClick(e) {
        e.preventDefault();
        if (isAnimating) return;
        
        if (isLoginMode) {
            switchToRegister();
        } else {
            switchToLogin();
        }
    }
    

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    console.log('📤 Formulario enviado:', data);
    
    if (isLoginMode) {
        // Modo login - usar la nueva función
        authManager.loginUser(data.email, data.password);
    } else {
        // Modo registro
        authManager.registerUser(data);
    }
}
    
   // Función para cambiar a modo registro con animación - MEJORADA
function switchToRegister() {
    if (isAnimating) return;
    isAnimating = true;
    
    const loginBox = document.querySelector('.login-box');
    const loginTitle = loginBox.querySelector('h1');
    const loginForm = loginBox.querySelector('form');
    const loginButton = loginBox.querySelector('button[type="submit"]');
    const switchLink = loginBox.querySelector('a[data-key="login.registrate"]');
    const switchText = loginBox.querySelector('p span[data-key="login.noCuenta"]');
    
    // Animación de fade out
    loginBox.style.opacity = '0';
    loginBox.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        // Cambiar atributos de datos para i18n
        if (loginTitle) loginTitle.setAttribute('data-key', 'register.titulo');
        if (switchText) switchText.setAttribute('data-key', 'register.siCuenta');
        if (switchLink) switchLink.setAttribute('data-key', 'register.iniciaSesion');
        if (loginButton) loginButton.setAttribute('data-key', 'register.boton');
        
        // Modificar el formulario - MEJORADO: preservar contenedor de mensajes
        if (loginForm) {
            // Guardar el contenedor de mensajes si existe
            const existingMessageContainer = loginForm.querySelector('.message-container');
            
            // Limpiar mensajes existentes al cambiar de modo
            if (existingMessageContainer) {
                existingMessageContainer.innerHTML = ''; // Limpiar todos los mensajes
            }
            
            // Limpiar el formulario pero preservar el botón
            const formChildren = Array.from(loginForm.children);
            const preservedElements = formChildren.filter(child => 
                child.classList.contains('message-container') || child.tagName === 'BUTTON'
            );
            
            loginForm.innerHTML = '';
            
            // Campos para registro
            const nameField = createInputField('text', 'name', 'register.nombre', 'Nombre completo');
            const emailField = createInputField('email', 'email', 'login.correo', 'Correo electrónico');
            const passwordField = createInputField('password', 'password', 'login.contrasena', 'Contraseña');
            const confirmPasswordField = createInputField('password', 'confirmPassword', 'register.confirmarContrasena', 'Confirmar contraseña');
            
            loginForm.appendChild(nameField);
            loginForm.appendChild(emailField);
            loginForm.appendChild(passwordField);
            loginForm.appendChild(confirmPasswordField);
            
            // Restaurar o crear el contenedor de mensajes
            if (existingMessageContainer) {
                loginForm.appendChild(existingMessageContainer);
            } else {
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message-container';
                loginForm.appendChild(messageContainer);
            }
            
            // Agregar el botón al final
            loginForm.appendChild(loginButton);
        }
        
        // Actualizar textos
        if (window.updateTexts) {
            window.updateTexts();
        }
        
        // Re-inicializar los listeners
        initializeSwitcher();
        
        // Animación de fade in
        setTimeout(() => {
            loginBox.style.opacity = '1';
            loginBox.style.transform = 'translateX(0)';
            isAnimating = false;
            isLoginMode = false;
        }, 50);
        
    }, 300);
}

// Función para cambiar a modo login con animación - MEJORADA
function switchToLogin() {
    if (isAnimating) return;
    isAnimating = true;
    
    const loginBox = document.querySelector('.login-box');
    const loginTitle = loginBox.querySelector('h1');
    const loginForm = loginBox.querySelector('form');
    const loginButton = loginBox.querySelector('button[type="submit"]');
    const switchLink = loginBox.querySelector('a[data-key="register.iniciaSesion"]');
    const switchText = loginBox.querySelector('p span[data-key="register.siCuenta"]');
    
    // Animación de fade out
    loginBox.style.opacity = '0';
    loginBox.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        // Restaurar atributos de datos para i18n
        if (loginTitle) loginTitle.setAttribute('data-key', 'login.titulo');
        if (switchText) switchText.setAttribute('data-key', 'login.noCuenta');
        if (switchLink) switchLink.setAttribute('data-key', 'login.registrate');
        if (loginButton) loginButton.setAttribute('data-key', 'login.boton');
        
        // Restaurar formulario de login - MEJORADO: preservar contenedor de mensajes
        if (loginForm) {
            // Guardar el contenedor de mensajes si existe
            const existingMessageContainer = loginForm.querySelector('.message-container');
            
            // Limpiar mensajes existentes al cambiar de modo
            if (existingMessageContainer) {
                existingMessageContainer.innerHTML = ''; // Limpiar todos los mensajes
            }
            
            // Limpiar el formulario pero preservar el botón
            const formChildren = Array.from(loginForm.children);
            const preservedElements = formChildren.filter(child => 
                child.classList.contains('message-container') || child.tagName === 'BUTTON'
            );
            
            loginForm.innerHTML = '';
            
            const emailField = createInputField('email', 'email', 'login.correo', 'Correo electrónico');
            const passwordField = createInputField('password', 'password', 'login.contrasena', 'Contraseña');
            
            loginForm.appendChild(emailField);
            loginForm.appendChild(passwordField);
            
            // Restaurar o crear el contenedor de mensajes
            if (existingMessageContainer) {
                loginForm.appendChild(existingMessageContainer);
            } else {
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message-container';
                loginForm.appendChild(messageContainer);
            }
            
            // Agregar el botón al final
            loginForm.appendChild(loginButton);
        }
        
        // Actualizar textos
        if (window.updateTexts) {
            window.updateTexts();
        }
        
        // Re-inicializar los listeners
        initializeSwitcher();
        
        // Animación de fade in
        setTimeout(() => {
            loginBox.style.opacity = '1';
            loginBox.style.transform = 'translateX(0)';
            isAnimating = false;
            isLoginMode = true;
        }, 50);
        
    }, 300);
}

    
    // Función auxiliar para crear campos de entrada
    function createInputField(type, name, dataKey, placeholder) {
        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.setAttribute('data-key-placeholder', dataKey);
        input.placeholder = placeholder;
        input.required = true;
        input.style.opacity = '0';
        input.style.transform = 'translateY(10px)';
        
        // Animación de entrada para nuevos campos
        setTimeout(() => {
            input.style.transition = 'all 0.3s ease';
            input.style.opacity = '1';
            input.style.transform = 'translateY(0)';
        }, 100);
        
        // Validación de contraseñas coincidentes
        if (name === 'confirmPassword') {
            input.addEventListener('input', validatePasswordMatch);
        }
        
        return input;
    }
    
    // Validar que las contraseñas coincidan (solo validación visual)
    function validatePasswordMatch() {
        const password = document.querySelector('input[name="password"]');
        const confirmPassword = document.querySelector('input[name="confirmPassword"]');
        
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Las contraseñas no coinciden');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
    
    // Aplicar estilos de transición iniciales
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        loginBox.style.transition = 'all 0.3s ease';
    }
    
    // Inicializar por primera vez
    initializeSwitcher();
    
    // También inicializar después de que i18n actualice los textos
    const originalUpdateTexts = window.updateTexts;
    if (originalUpdateTexts) {
        window.updateTexts = function() {
            originalUpdateTexts();
            setTimeout(initializeSwitcher, 50);
        };
    }
    
    // Exportar funciones para uso futuro si es necesario
    window.loginSwitcher = {
        getCurrentMode: () => isLoginMode ? 'login' : 'register',
        switchToLogin,
        switchToRegister
    };
});