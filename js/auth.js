// auth.js - Manejo básico de autenticación
console.log('🔐 Auth.js cargado');

class AuthManager {
    constructor() {
        // ✅ CORREGIDO: Usar window.supabase que se inicializa en supabase-client.js
        this.supabase = window.supabase;
        this.init();
    }

    init() {
        console.log('✅ AuthManager inicializado');
        
        // Verificar que supabase esté disponible
        if (!this.supabase) {
            console.error('❌ Supabase no disponible en AuthManager');
            return;
        }
        
        // ✅ NUEVO: Verificar si estamos en el dashboard para evitar mensajes de bienvenida
        this.isDashboard = window.location.pathname.includes('dashboard.html');
        this.isLoginPage = window.location.pathname.includes('login.html');
        
        // ✅ NUEVO: Verificar sesión al iniciar
        this.checkInitialSession();
        
        // Escuchar cambios de autenticación
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Estado de autenticación cambiado:', event);
            
            // ✅ NUEVO: Manejar errores de token
            if (event === 'TOKEN_REFRESHED' && !session) {
                console.log('🔐 Token refrescado pero sin sesión, limpiando...');
                await this.forceSignOut();
                return;
            }
            
            if (event === 'SIGNED_OUT') {
                console.log('🔐 Usuario cerró sesión');
                // Limpiar credenciales temporales
                if (window.tempUserCredentials) {
                    delete window.tempUserCredentials;
                }
                return;
            }
            
            // ✅ CORREGIDO: Manejar SIGNED_IN y sesiones existentes
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !this.isDashboard) {
                // Esperar un poco para asegurar que las traducciones estén cargadas
                setTimeout(async () => {
                    await this.handleUserSession(session, event);
                }, 100);
            }
            
            // ✅ CORREGIDO: En el dashboard, solo registrar la sesión sin mostrar mensajes
            if (event === 'INITIAL_SESSION' && session && this.isDashboard) {
                console.log('📊 Dashboard: Sesión detectada, sin mostrar mensaje de bienvenida');
            }
        });
    }

    // ✅ NUEVA FUNCIÓN: Verificar sesión inicial
    async checkInitialSession() {
        try {
            // Solo verificar si estamos en la página de login
            if (this.isLoginPage) {
                const user = await this.checkAndCleanInvalidSession();
                if (!user) {
                    console.log('🔐 No hay sesión válida al cargar la página');
                }
            }
        } catch (error) {
            console.error('❌ Error verificando sesión inicial:', error);
        }
    }

    // ✅ NUEVA FUNCIÓN: Verificar y limpiar sesión inválida
    async checkAndCleanInvalidSession() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) {
                console.log('🔐 Error obteniendo usuario, limpiando sesión:', error);
                await this.forceSignOut();
                return null;
            }
            
            if (!user) {
                console.log('🔐 Usuario no encontrado, limpiando sesión');
                await this.forceSignOut();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            await this.forceSignOut();
            return null;
        }
    }

    // ✅ NUEVA FUNCIÓN: Forzar cierre de sesión
    async forceSignOut() {
        try {
            console.log('🔐 Forzando cierre de sesión...');
            
            // Limpiar todas las credenciales temporales
            if (window.tempUserCredentials) {
                delete window.tempUserCredentials;
            }
            
            // Cerrar sesión en Supabase
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                console.log('⚠️ Error en signOut:', error);
            }
            
            // Limpiar localStorage manualmente
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            
            console.log('✅ Sesión limpiada completamente');
            
        } catch (error) {
            console.error('❌ Error forzando cierre de sesión:', error);
        }
    }

// ✅ ACTUALIZADO: Manejar sesión de usuario
async handleUserSession(session, event) {
    console.log('👤 Manejando sesión de usuario:', session.user.email);
    
    // Verificar que las traducciones estén cargadas
    if (!window.translations) {
        console.warn('⚠️ Traducciones no disponibles, reintentando en 500ms...');
        setTimeout(() => this.handleUserSession(session, event), 500);
        return;
    }

    // ✅ VERIFICAR SI EL PERFIL BÁSICO ESTÁ COMPLETO
    const profileComplete = await this.checkBasicProfileComplete(session.user.id);
    
    if (!profileComplete) {
        console.log('📝 Perfil incompleto, mostrando formulario...');
        
        // Mostrar mensaje y formulario de perfil
        if (event === 'SIGNED_IN') {
            this.showSuccess('¡Email verificado! Ahora completa tu información de perfil.');
        } else {
            this.showInfo('Completa tu información de perfil para continuar.');
        }
        
        // Mostrar formulario de registro completo después de un breve delay
        setTimeout(() => {
            if (window.showCompleteRegistrationForm) {
                window.showCompleteRegistrationForm(session.user.email);
            }
        }, 1500);
        
    } else {
        console.log('✅ Perfil completo, redirigiendo al dashboard');
        
        // Solo mostrar mensaje de éxito si es un login nuevo
        if (event === 'SIGNED_IN') {
            const welcomeMessage = this.getTranslation('auth.success.loginSuccess')
                .replace('{email}', session.user.email);
            this.showSuccess(welcomeMessage);
        }
        
        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
            window.location.href = '../html/dashboard.html';
        }, 1500);
    }
}

    // Función para obtener texto traducido - MEJORADA
    getTranslation(key, fallback = 'Texto no encontrado') {
        try {
            // Verificar si las traducciones están disponibles
            if (!window.translations) {
                console.warn('⚠️ Traducciones no cargadas aún para:', key);
                return fallback;
            }
            
            const keys = key.split('.');
            let text = window.translations;
            
            for (const k of keys) {
                if (text && typeof text === 'object' && k in text) {
                    text = text[k];
                } else {
                    console.warn('❌ Clave de traducción no encontrada:', key);
                    return fallback;
                }
            }
            
            return text || fallback;
        } catch (error) {
            console.warn('❌ Error al obtener traducción:', key, error);
            return fallback;
        }
    }

    // ✅ CORREGIDO: Registro básico (Paso 1) - CON VERIFICACIÓN DE EMAIL Y SPINNER UNIVERSAL
    async registerBasicUser(userData) {
        console.log('📝 Registrando usuario (Paso 1):', userData);
        
        try {
            // Limpiar mensajes anteriores
            this.clearMessages();

            // 1. Primero validamos los datos
            if (!this.validateRegistration(userData)) {
                return false;
            }

            // 2. Mostrar spinner de carga UNIVERSAL
            this.showSpinner(true, 'spinner.creatingAccount');

            // 3. Llamar a Supabase para registro CON VERIFICACIÓN DE EMAIL
            const { data, error } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name
                    },
                    // ✅ FORZAR VERIFICACIÓN DE EMAIL
                    emailRedirectTo: `${window.location.origin}/html/login.html`
                }
            });

            console.log('📨 Respuesta de Supabase - Data:', data);
            console.log('📨 Respuesta de Supabase - Error:', error);

            // 4. Manejar la respuesta
            if (error) {
                console.error('❌ Error de Supabase:', error);
                this.showError(this.getFriendlyError(error));
                return false;
            }

            // Verificar si el usuario ya existe
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                this.showError(this.getTranslation('auth.errors.emailAlreadyRegistered'));
                return false;
            }

            if (data.user) {
                console.log('✅ Usuario registrado (Paso 1):', data.user);
                
                // ✅ CORREGIDO: Guardar credenciales temporalmente para login posterior
                window.tempUserCredentials = {
                    email: userData.email,
                    password: userData.password,
                    name: userData.name
                };
                
                // ✅ CORREGIDO: Crear perfil básico automáticamente
                await this.createBasicProfile(data.user.id, userData.name, userData.email);
                
                // ✅ CORREGIDO: Mostrar mensaje de verificación de email
                this.showSuccess('¡Registro exitoso! Por favor verifica tu email antes de continuar. Revisa tu bandeja de entrada y spam.');
                
                // ✅ CORREGIDO: Volver al formulario de login después de un tiempo
                setTimeout(() => {
                    if (window.showLoginForm) {
                        window.showLoginForm();
                    }
                }, 4000);
                
                return true;
            }

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            this.showError(this.getTranslation('auth.errors.unexpectedError') + ': ' + error.message);
            return false;
        } finally {
            this.showSpinner(false);
        }
    }

    // ✅ CORREGIDO: Crear perfil básico automáticamente
    async createBasicProfile(userId, fullName, email) {
        try {
            console.log('👤 Creando perfil básico para usuario:', userId);
            
            const basicProfileData = {
                id: userId,
                username: this.generateUsername(fullName, email),
                full_name: fullName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📋 Datos del perfil básico:', basicProfileData);

            // ✅ CORREGIDO: Usar upsert para evitar errores si el perfil ya existe
            const { data, error } = await this.supabase
                .from('profiles')
                .upsert(basicProfileData)
                .select();

            if (error) {
                console.error('❌ Error creando perfil básico:', error);
                
                // ✅ CORREGIDO: Intentar insert como fallback
                const { data: insertData, error: insertError } = await this.supabase
                    .from('profiles')
                    .insert(basicProfileData)
                    .select();

                if (insertError) {
                    console.error('❌ Error en insert de perfil básico:', insertError);
                    throw insertError;
                }
                
                console.log('✅ Perfil básico creado via insert:', insertData);
                return;
            }

            console.log('✅ Perfil básico creado/actualizado:', data);

        } catch (error) {
            console.error('❌ Error en createBasicProfile:', error);
            // No lanzamos el error para no interrumpir el flujo de registro
        }
    }

    // ✅ CORREGIDA: Función checkAuthAndVerification con manejo de sesiones inválidas
    async checkAuthAndVerification() {
        try {
            // Primero verificar si la sesión es válida
            const user = await this.checkAndCleanInvalidSession();
            if (!user) {
                return { success: false, message: 'Sesión inválida. Por favor inicia sesión nuevamente.' };
            }
            
            // ✅ VERIFICAR SI EL EMAIL ESTÁ CONFIRMADO
            if (!user.email_confirmed_at) {
                console.log('❌ Email no verificado');
                return { 
                    success: false, 
                    message: 'Por favor verifica tu email antes de completar tu perfil.',
                    user: user 
                };
            }
            
            console.log('✅ Usuario autenticado y verificado:', user.email);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            await this.forceSignOut();
            return { success: false, message: 'Error de autenticación. Por favor inicia sesión nuevamente.' };
        }
    }

// ✅ ALTERNATIVA: Versión más flexible - requiere solo algunos campos adicionales
async checkBasicProfileComplete(userId) {
    try {
        // Primero verificar autenticación
        const user = await this.checkAndCleanInvalidSession();
        if (!user) {
            return false;
        }

        const { data: profile, error } = await this.supabase
            .from('profiles')
            .select('username, full_name, profession, age, main_interest, location, bio, skills')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Error verificando perfil:', error);
            
            // Si es error de autenticación, limpiar sesión
            if (error.message?.includes('JWT') || error.code === 'PGRST301') {
                console.log('🔐 Error de autenticación JWT, limpiando sesión');
                await this.forceSignOut();
                return false;
            }
            
            // Si no existe el perfil, definitivamente no está completo
            if (error.code === 'PGRST116') {
                console.log('❌ Perfil no existe en la base de datos');
                return false;
            }
            return false;
        }

        // ✅ VERIFICAR CAMPOS BÁSICOS CRÍTICOS (obligatorios)
        const hasBasicInfo = profile && 
                            profile.username && 
                            profile.username.trim() !== '' && 
                            profile.full_name && 
                            profile.full_name.trim() !== '';

        // ✅ VERIFICAR CAMPOS ADICIONALES (al menos 3 de 4 campos principales)
        const additionalFields = [
            profile.profession?.trim(),
            profile.age,
            profile.main_interest?.trim(), 
            profile.location?.trim()
        ];
        
        const filledAdditionalFields = additionalFields.filter(field => 
            field && field !== '' && field !== null && field !== undefined
        ).length;

        const hasSufficientAdditionalInfo = filledAdditionalFields >= 2; // Requiere al menos 2 campos

        console.log('📊 Estado del perfil:', {
            exists: !!profile,
            hasUsername: !!(profile?.username?.trim()),
            hasFullName: !!(profile?.full_name?.trim()),
            hasProfession: !!(profile?.profession?.trim()),
            hasAge: !!profile?.age,
            hasMainInterest: !!(profile?.main_interest?.trim()),
            hasLocation: !!(profile?.location?.trim()),
            filledAdditionalFields: filledAdditionalFields,
            hasBasicInfo: hasBasicInfo,
            hasSufficientAdditionalInfo: hasSufficientAdditionalInfo,
            isComplete: hasBasicInfo && hasSufficientAdditionalInfo,
            profileData: profile
        });

        // ✅ SOLO considerar completo si tiene información básica Y suficiente información adicional
        return hasBasicInfo && hasSufficientAdditionalInfo;

    } catch (error) {
        console.error('❌ Error en checkBasicProfileComplete:', error);
        
        // Si es error de autenticación, limpiar sesión
        if (error.message?.includes('JWT') || error.message?.includes('auth')) {
            await this.forceSignOut();
        }
        
        return false;
    }
}

    // ✅ CORREGIDO: Completar perfil de usuario (Paso 2) - CON SPINNER UNIVERSAL
    async completeUserProfile(profileData) {
        try {
            console.log('👤 Completando perfil de usuario:', profileData);
            
            // ✅ VERIFICAR AUTENTICACIÓN PRIMERO
            const authCheck = await this.checkAuthAndVerification();
            if (!authCheck.success) {
                throw new Error(authCheck.message);
            }

            const userId = authCheck.user.id;
            console.log('✅ Usuario autenticado para completar perfil:', userId);

            // Mostrar spinner UNIVERSAL
            this.showSpinner(true, 'spinner.savingProfile');

            // ✅ OBTENER PERFIL ACTUAL PARA MANTENER DATOS EXISTENTES
            const { data: currentProfile, error: fetchError } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('❌ Error obteniendo perfil actual:', fetchError);
            }

            // Combinar datos existentes con nuevos datos
            const updateData = {
                username: currentProfile?.username || this.generateUsername(currentProfile?.full_name || 'Usuario', authCheck.user.email),
                full_name: currentProfile?.full_name || 'Usuario', // Valor por defecto
                profession: profileData.profession || currentProfile?.profession || '',
                age: profileData.age || currentProfile?.age || null,
                main_interest: profileData.main_interest || currentProfile?.main_interest || '',
                location: profileData.location || currentProfile?.location || '',
                bio: profileData.bio || currentProfile?.bio || '',
                skills: profileData.skills && profileData.skills.length > 0 ? 
                        profileData.skills : (currentProfile?.skills || []),
                updated_at: new Date().toISOString()
            };

            console.log('📋 Datos a actualizar:', updateData);

            // ✅ CORREGIDO: Usar upsert para crear o actualizar
            const { data, error } = await this.supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    ...updateData
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error actualizando perfil:', error);
                throw error;
            }

            console.log('✅ Perfil actualizado:', data);
            
            // ✅ CORREGIDO: Limpiar credenciales temporales
            if (window.tempUserCredentials) {
                delete window.tempUserCredentials;
            }
            
            // Mostrar mensaje de éxito
            this.showSuccess('¡Perfil completado exitosamente! Redirigiendo al dashboard...');
            
            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
                window.location.href = '../html/dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('❌ Error completando perfil:', error);
            this.showError('Error al completar el perfil: ' + error.message);
        } finally {
            this.showSpinner(false);
        }
    }

    // ✅ CORREGIDO: Omitir completar perfil e ir al dashboard - CON SPINNER UNIVERSAL
    async skipProfileCompletion() {
        try {
            console.log('⏭️ Omitiendo completar perfil');
            
            // ✅ VERIFICAR AUTENTICACIÓN PRIMERO
            const authCheck = await this.checkAuthAndVerification();
            if (!authCheck.success) {
                throw new Error(authCheck.message);
            }

            // Mostrar spinner mientras se procesa
            this.showSpinner(true, 'spinner.processing');

            // ✅ CREAR PERFIL BÁSICO MÍNIMO SI NO EXISTE
            const profileExists = await this.checkBasicProfileComplete(authCheck.user.id);
            if (!profileExists) {
                console.log('📝 Creando perfil básico mínimo...');
                await this.createBasicProfile(
                    authCheck.user.id, 
                    authCheck.user.user_metadata?.full_name || 'Usuario',
                    authCheck.user.email
                );
            }

            console.log('✅ Usuario autenticado, redirigiendo al dashboard...');
            
            // ✅ CORREGIDO: Limpiar credenciales temporales
            if (window.tempUserCredentials) {
                delete window.tempUserCredentials;
            }
            
            // Mostrar mensaje informativo
            this.showSuccess('¡Puedes completar tu perfil más tarde! Redirigiendo al dashboard...');
            
            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
                window.location.href = '../html/dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('❌ Error omitiendo perfil:', error);
            this.showError('Error al redirigir: ' + error.message);
        } finally {
            this.showSpinner(false);
        }
    }

    // ✅ NUEVA FUNCIÓN: Mostrar mensaje informativo
    showInfo(message, duration = 5000) {
        this.showMessage(message, 'info', duration);
    }

    // Función para iniciar sesión - NUEVA CON SPINNER UNIVERSAL
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

            // 2. Mostrar spinner de carga UNIVERSAL
            this.showSpinner(true, 'spinner.signingIn');

            // 3. Llamar a Supabase para login
            const { data, error } = await this.supabase.auth.signInWithPassword({
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
                
                // ✅ NUEVO: Verificar si el email está confirmado
                if (!data.user.email_confirmed_at) {
                    this.showError('Por favor verifica tu email antes de continuar. Revisa tu bandeja de entrada.');
                    return false;
                }
                
                // El éxito se manejará en onAuthStateChange
                return true;
            }

        } catch (error) {
            console.error('❌ Error inesperado en login:', error);
            this.showError(this.getTranslation('auth.errors.unexpectedError') + ': ' + error.message);
            return false;
        } finally {
            this.showSpinner(false);
        }
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

    // ✅ NUEVA FUNCIÓN: Generar username automáticamente
    generateUsername(fullName, email) {
        // Intentar crear username desde el nombre
        if (fullName && fullName.trim() !== '') {
            const nameParts = fullName.toLowerCase().split(' ');
            if (nameParts.length >= 2) {
                return (nameParts[0] + nameParts[1].charAt(0)).replace(/[^a-z0-9]/g, '');
            } else {
                return nameParts[0].replace(/[^a-z0-9]/g, '');
            }
        }
        
        // Si no hay nombre, usar la parte del email antes del @
        return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // ✅ CORREGIDO: Mostrar/ocultar spinner de carga - AHORA USA SPINNER UNIVERSAL
    showSpinner(show, textKey = 'spinner.loading') {
        if (window.universalSpinner) {
            if (show) {
                universalSpinner.show(textKey);
            } else {
                universalSpinner.hide();
            }
        } else {
            console.warn('⚠️ Spinner universal no disponible, usando fallback');
            // Fallback básico si el spinner universal no está disponible
            this.showSpinnerFallback(show);
        }
        
        // Deshabilitar/habilitar botones mientras carga
        const buttons = document.querySelectorAll('.login-box button[type="submit"]');
        buttons.forEach(button => {
            button.disabled = show;
        });
    }

    // ✅ NUEVA FUNCIÓN: Fallback para spinner (solo si spinner universal no está disponible)
    showSpinnerFallback(show) {
        let spinner = document.getElementById('auth-spinner');
        
        if (show && !spinner) {
            spinner = document.createElement('div');
            spinner.id = 'auth-spinner';
            spinner.className = 'auth-spinner';
            spinner.innerHTML = `
                <div class="spinner"></div>
                <span>${this.getTranslation('spinner.loading', 'Cargando...')}</span>
            `;
            document.body.appendChild(spinner);
        }
        
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
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
        
        // ✅ CORREGIDO: Nunca mostrar alerts - eliminar completamente esta parte
        if (!messageContainer) {
            console.log('📝 No se encontró contenedor de mensajes, omitiendo mensaje:', message);
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

// ✅ NUEVO: Hacer funciones disponibles globalmente
window.authManager = authManager;