const SUPABASE_URL = 'https://oslgfgvyngdivbzuvgou.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGdmZ3Z5bmdkaXZienV2Z291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzUyODUsImV4cCI6MjA3ODA1MTI4NX0.4JbAuuS4rglPlA_UQtOJ_4fJVZBilXa-X0ROFFIaKa4'; // Reemplaza con tu clave

// Inicializar el cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Inicializado');