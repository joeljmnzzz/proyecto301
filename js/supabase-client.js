// supabase-client.js - VERSIÓN CORREGIDA
const SUPABASE_URL = 'https://oslgfgvyngdivbzuvgou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGdmZ3Z5bmdkaXZienV2Z291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzUyODUsImV4cCI6MjA3ODA1MTI4NX0.4JbAuuS4rglPlA_UQtOJ_4fJVZBilXa-X0ROFFIaKa4';

// Verificar que Supabase esté cargado antes de crear el cliente
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase CDN no cargado - verifica que el script esté incluido');
} else {
    try {
        // Crear el cliente de Supabase
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Hacerlo global para que otros archivos puedan usarlo
        window.supabase = supabaseClient;
        console.log('✅ Supabase inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
    }
}