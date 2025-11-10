// dashboard.js
document.addEventListener('DOMContentLoaded', async function() {
    // Mostrar spinner inmediatamente con traducción
    if (window.universalSpinner) {
        universalSpinner.show('spinner.loadingDashboard');
    }
    
    // Esperar a que las traducciones estén cargadas
    if (!window.translations) {
        console.log('🔄 Esperando traducciones...');
        setTimeout(() => {
            this.dispatchEvent(new Event('DOMContentLoaded'));
        }, 100);
        return;
    }
    
    try {
        await loadUserName();
        await loadDashboardData();
        console.log('✅ Dashboard cargado completamente');
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
    } finally {
        // Ocultar spinner cuando todo esté listo
        if (window.universalSpinner) {
            universalSpinner.hide();
        }
    }
});

async function loadUserName() {
    try {
        if (window.universalSpinner) {
            universalSpinner.show('spinner.loadingUserInfo');
        }
        
        if (!window.supabase) {
            console.error('❌ Supabase no está inicializado');
            throw new Error('Supabase no disponible');
        }

        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Error obteniendo usuario:', userError);
            throw new Error('Usuario no autenticado');
        }

        console.log('✅ Usuario encontrado:', user);
        console.log('📝 User metadata:', user.user_metadata);

        // ✅ CORREGIDO: Obtener el Display Name directamente del user_metadata
        let displayName = 'Usuario';
        
        // Primero intentar con user_metadata (que viene de la autenticación)
        if (user.user_metadata && user.user_metadata.full_name) {
            displayName = user.user_metadata.full_name;
            console.log('✅ Usando Display Name de user_metadata:', displayName);
        }
        // Si no hay en user_metadata, intentar con el email
        else if (user.email) {
            displayName = user.email;
            console.log('ℹ️ Usando email como nombre:', displayName);
        }

        // ✅ OPCIONAL: Si quieres también buscar en la tabla profiles como respaldo
        // (pero el Display Name principal viene de user_metadata)
        if (displayName === 'Usuario' || displayName === user.email) {
            try {
                if (window.universalSpinner) {
                    universalSpinner.show('spinner.loadingProfile');
                }
                
                const { data: profile, error: profileError } = await window.supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    const profileName = profile.full_name || profile.username;
                    if (profileName) {
                        displayName = profileName;
                        console.log('✅ Usando nombre del perfil:', displayName);
                    }
                }
            } catch (profileError) {
                console.log('ℹ️ No se pudo cargar perfil, usando datos de autenticación');
            }
        }

        // ✅ NUEVO: Extraer solo el primer nombre (antes del primer espacio)
        displayName = getFirstName(displayName);
        console.log('👤 Primer nombre extraído:', displayName);

        // Actualizar el nombre en el dashboard
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = displayName;
            console.log('✅ Nombre actualizado en dashboard:', displayName);
        }

    } catch (error) {
        console.error('❌ Error cargando nombre:', error);
        throw error; // Re-lanzar el error para manejarlo en el nivel superior
    }
}

// ✅ NUEVA FUNCIÓN: Extraer solo el primer nombre
function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'Usuario';
    }
    
    // Si es un email, extraer la parte antes del @
    if (fullName.includes('@')) {
        const emailPart = fullName.split('@')[0];
        // Capitalizar primera letra del email
        return emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase();
    }
    
    // Extraer solo el primer nombre (antes del primer espacio)
    const firstName = fullName.split(' ')[0];
    
    // Capitalizar primera letra
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

async function loadDashboardData() {
    try {
        if (window.universalSpinner) {
            universalSpinner.show('spinner.loadingDashboardData');
        }
        
        // Aquí iría el resto de tu código para cargar proyectos, métricas, etc.
        console.log('📊 Cargando datos del dashboard...');
        
        // Simular carga de datos (reemplaza con tus funciones reales)
        await simulateDataLoading();
        
        // Ejemplo de cómo usar traducciones en JavaScript
        updateDashboardTexts();
        
    } catch (error) {
        console.error('❌ Error cargando datos del dashboard:', error);
        throw error;
    }
}

// Función de ejemplo para simular carga de datos
async function simulateDataLoading() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Datos del dashboard cargados');
            resolve();
        }, 1000); // Simula 1 segundo de carga
    });
}

function updateDashboardTexts() {
    // Esta función se llama cuando cambian las traducciones
    // Puedes actualizar textos dinámicos aquí si es necesario
    console.log('🔄 Actualizando textos del dashboard');
}

// Hacer la función global para que i18n.js pueda llamarla
window.updateDashboardTexts = updateDashboardTexts;

// Manejar errores no capturados para ocultar el spinner en caso de error
window.addEventListener('error', function() {
    if (window.universalSpinner) {
        universalSpinner.hide();
    }
});

// También ocultar spinner si la página se descarga
window.addEventListener('beforeunload', function() {
    if (window.universalSpinner) {
        universalSpinner.hide();
    }
});