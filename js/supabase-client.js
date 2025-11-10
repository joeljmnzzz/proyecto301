// supabase-client.js - VERSIÓN MEJORADA
const SUPABASE_URL = 'https://oslgfgvyngdivbzuvgou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGdmZ3Z5bmdkaXZienV2Z291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzUyODUsImV4cCI6MjA3ODA1MTI4NX0.4JbAuuS4rglPlA_UQtOJ_4fJVZBilXa-X0ROFFIaKa4';

console.log('🔄 Inicializando Supabase...');

// Verificar que Supabase esté cargado antes de crear el cliente
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase CDN no cargado - verifica que el script esté incluido');
} else {
    try {
        // Crear el cliente de Supabase con configuración adicional
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        // Hacerlo global para que otros archivos puedan usarlo
        window.supabase = supabaseClient;
        console.log('✅ Supabase inicializado correctamente');
        
        // Emitir evento para notificar que Supabase está listo
        window.dispatchEvent(new CustomEvent('supabase-ready'));
        
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
    }
}