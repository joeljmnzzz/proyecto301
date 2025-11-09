// auth.js - Manejo básico de autenticación
console.log('🔐 Auth.js cargado');

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('✅ AuthManager inicializado');
        
        // Por ahora solo escuchamos cambios de autenticación
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Estado de autenticación cambiado:', event);
            console.log('Sesión:', session);
            
            // Manejar cuando el usuario inicia sesión exitosamente
            if (event === 'SIGNED_IN') {
                this.handleLoginSuccess(session);
            }
        });
    }

    // Función para obtener texto traducido
    getTranslation(key, fallback = 'Texto no encontrado') {
        try {
            const keys = key.split('.');
            let text = window.translations || {};
            
            keys.forEach(k => {
                if (text) text = text[k];
            });
            
            return text || fallback;
        } catch (error) {
            console.warn('❌ Error al obtener traducción:', key, error);
            return fallback;
        }
    }

    // Función básica para registrar usuario
    async registerUser(userData) {
        console.log('📝 Registrando usuario:', userData);
        
        try {
            // Limpiar mensajes anteriores
            this.clearMessages();

            // 1. Primero validamos los datos
            if (!this.validateRegistration(userData)) {
                return false;
            }

            // 2. Mostrar que estamos procesando
            this.showLoading(true, 'register.boton');

            // 3. Llamar a Supabase
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name
                    }
                }
            });

            console.log('📨 Respuesta de Supabase - Data:', data);
            console.log('📨 Respuesta de Supabase - Error:', error);

            // 4. Manejar la respuesta - CORRECCIÓN IMPORTANTE
            if (error) {
                console.error('❌ Error de Supabase:', error);
                this.showError(this.getFriendlyError(error));
                return false;
            }

            // Verificar si el usuario ya existe (cuando no hay error pero tampoco se crea usuario nuevo)
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                this.showError(this.getTranslation('auth.errors.emailAlreadyRegistered'));
                return false;
            }

            if (data.user) {
                console.log('✅ Usuario registrado:', data.user);
                this.showSuccess(this.getTranslation('auth.success.registrationSuccess'));
                return true;
            }

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            this.showError(this.getTranslation('auth.errors.unexpectedError') + ': ' + error.message);
            return false;
        } finally {
            this.showLoading(false, 'register.boton');
        }
    }

    // Función para iniciar sesión - NUEVA
    async loginUser(email, password) {
        console.log('🔐 Intentando login:', email);
        
        try {
            // Limpiar mensajes anteriores
            this.clearMessages();

            // 1. Validar datos básicos
            if (!email || !password) {
                this.showError(this.getTranslation('auth.errors.completeAllFields'));
                return false;
            }

            // 2. Mostrar que estamos procesando
            this.showLoading(true, 'login.boton');

            // 3. Llamar a Supabase para login
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('📨 Respuesta de Login - Data:', data);
            console.log('📨 Respuesta de Login - Error:', error);

            // 4. Manejar la respuesta
            if (error) {
                console.error('❌ Error de Supabase en login:', error);
                this.showError(this.getFriendlyError(error));
                return false;
            }

            if (data.user) {
                console.log('✅ Login exitoso:', data.user.email);
                // El éxito se manejará en onAuthStateChange
                return true;
            }

        } catch (error) {
            console.error('❌ Error inesperado en login:', error);
            this.showError(this.getTranslation('auth.errors.unexpectedError') + ': ' + error.message);
            return false;
        } finally {
            this.showLoading(false, 'login.boton');
        }
    }

    // Manejar éxito de login
    handleLoginSuccess(session) {
        console.log('🎉 Usuario autenticado:', session.user.email);
        
        // Usar traducción con interpolación de variables
        const welcomeMessage = this.getTranslation('auth.success.loginSuccess')
            .replace('{email}', session.user.email);
        
        this.showSuccess(welcomeMessage);
        
        // Aquí podrías redirigir a otra página o actualizar la UI
        // Por ejemplo:
        // window.location.href = '/dashboard.html';
        
        // Por ahora solo mostramos el mensaje de éxito
        setTimeout(() => {
            // Opcional: limpiar el formulario después del login exitoso
            const form = document.querySelector('.login-box form');
            if (form) {
                form.reset();
            }
        }, 2000);
    }

    // Validación simple - CORREGIDA
    validateRegistration(userData) {
        const { email, password, confirmPassword, name } = userData;

        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            this.showError(this.getTranslation('auth.errors.passwordsNoMatch'));
            return false;
        }

        // Verificar longitud de contraseña
        if (password.length < 6) {
            this.showError(this.getTranslation('auth.errors.passwordTooShort'));
            return false;
        }

        // Verificar que el nombre no esté vacío
        if (!name || name.trim().length === 0) {
            this.showError(this.getTranslation('auth.errors.nameRequired'));
            return false;
        }

        return true;
    }

    // Mostrar/ocultar loading
    showLoading(show, buttonKey) {
        const button = document.querySelector('.login-box button[type="submit"]');
        if (button) {
            if (show) {
                button.disabled = true;
                button.textContent = this.getTranslation('auth.loading.processing', 'Procesando...');
            } else {
                button.disabled = false;
                // Restaurar texto original
                if (window.updateTexts) {
                    window.updateTexts();
                }
            }
        }
    }

    // Mostrar errores en el contenedor de mensajes
    showError(message, duration = 5000) {
        this.showMessage(message, 'error', duration);
    }

    // Mostrar éxito en el contenedor de mensajes
    showSuccess(message, duration = 5000) {
        this.showMessage(message, 'success', duration);
    }

    // Función principal para mostrar mensajes - MEJORADA
    showMessage(message, type = 'info', duration = 5000) {
        let messageContainer = document.querySelector('.message-container');
        
        // Si no se encuentra, puede que estemos en modo registro
        if (!messageContainer) {
            messageContainer = document.querySelector('.login-box form .message-container');
        }
        
        if (!messageContainer) {
            console.error('❌ No se encontró el contenedor de mensajes');
            alert(`${type === 'error' ? '❌' : '✅'} ${message}`); // Fallback
            return;
        }

        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        // Agregar al contenedor
        messageContainer.appendChild(messageElement);

        // Auto-eliminar después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    this.removeMessage(messageElement);
                }
            }, duration);
        }

        // También permitir cerrar haciendo clic
        messageElement.addEventListener('click', () => {
            this.removeMessage(messageElement);
        });
    }

    // Función para remover mensajes individuales
    removeMessage(messageElement) {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 300);
    }

    // Función para limpiar todos los mensajes - CORREGIDA
    clearMessages() {
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.querySelector('.login-box form .message-container');
        }
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    // Traducir errores de Supabase - MEJORADA para usar i18n
    getFriendlyError(error) {
        console.log('🔍 Analizando error:', error);
        
        // Verificar diferentes formatos de error que Supabase puede devolver
        const errorMessage = error.message || '';
        
        const errorMap = {
            'User already registered': 'auth.errors.emailAlreadyRegistered',
            'user_already_exists': 'auth.errors.emailAlreadyRegistered',
            'User already exists': 'auth.errors.emailAlreadyRegistered',
            'Invalid login credentials': 'auth.errors.invalidCredentials',
            'Email not confirmed': 'auth.errors.emailNotVerified',
            'Password should be at least 6 characters': 'auth.errors.passwordTooShort',
            'Invalid email': 'auth.errors.invalidEmail',
            'Invalid password': 'auth.errors.invalidCredentials',
            'User not found': 'auth.errors.userNotFound'
        };

        // Buscar coincidencia en el mensaje de error
        for (const [key, translationKey] of Object.entries(errorMap)) {
            if (errorMessage.includes(key)) {
                return this.getTranslation(translationKey);
            }
        }

        // Si no encontramos coincidencia, devolver el mensaje original traducido
        return this.getTranslation('auth.errors.unknownError');
    }
}

// Crear instancia global
const authManager = new AuthManager();