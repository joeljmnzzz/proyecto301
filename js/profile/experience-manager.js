// js/profile/experience-manager.js
class ExperienceManager {
    constructor() {
        this.modal = null;
        this.experiences = [];
        this.currentUserId = null;
        this.init();
    }

    async init() {
        // Inicializar modal
        this.modal = new ExperienceModal();
        
        // Obtener usuario actual
        await this.getCurrentUser();
        
        console.log('✅ ExperienceManager inicializado');
    }

    // Obtener usuario actual
    async getCurrentUser() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            this.currentUserId = user?.id;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
        }
    }

    // Abrir modal para agregar/editar experiencia
    openExperienceModal(experienceData = null) {
        if (!this.currentUserId) {
            alert('Debes iniciar sesión para gestionar experiencias');
            return;
        }

        if (this.modal) {
            this.modal.open(experienceData);
        }
    }

    
    // Cargar experiencias del usuario
    async loadExperiences(userId = null) {
        try {
            const targetUserId = userId || this.currentUserId;
            
            if (!targetUserId) {
                console.warn('No user ID provided for loading experiences');
                return;
            }

            console.log('📥 Cargando experiencias para usuario:', targetUserId);

            const { data: experiences, error } = await window.supabase
                .from('experiences')
                .select('*')
                .eq('user_id', targetUserId)
                .order('start_date', { ascending: false });

            if (error) {
                throw error;
            }

            this.experiences = experiences || [];
            console.log('✅ Experiencias cargadas:', this.experiences);

            // Disparar evento para que timeline-renderer se actualice
            this.dispatchExperiencesLoaded();

        } catch (error) {
            console.error('❌ Error cargando experiencias:', error);
            this.experiences = [];
        }
    }

    // Guardar experiencia (crear o actualizar)
    async saveExperience(experienceData) {
        try {
            if (!this.currentUserId) {
                throw new Error('Usuario no autenticado');
            }

            // Preparar datos para Supabase
            const dataToSave = {
                ...experienceData,
                user_id: this.currentUserId,
                updated_at: new Date().toISOString()
            };

            let result;

            if (experienceData.id) {
                // Actualizar experiencia existente
                console.log('🔄 Actualizando experiencia:', experienceData.id);
                result = await window.supabase
                    .from('experiences')
                    .update(dataToSave)
                    .eq('id', experienceData.id)
                    .eq('user_id', this.currentUserId);
            } else {
                // Crear nueva experiencia
                console.log('➕ Creando nueva experiencia');
                dataToSave.created_at = new Date().toISOString();
                result = await window.supabase
                    .from('experiences')
                    .insert([dataToSave])
                    .select();
            }

            if (result.error) {
                throw result.error;
            }

            console.log('✅ Experiencia guardada:', result.data);

            // 🔄 SINCRONIZAR SKILLS AUTOMÁTICAMENTE
            await this.syncSkillsFromExperience(experienceData);

            // Recargar experiencias
            await this.loadExperiences();

            // Mostrar confirmación
            this.showSuccessMessage(experienceData.id ? 'Experiencia actualizada' : 'Experiencia agregada');

            return result.data;

        } catch (error) {
            console.error('❌ Error guardando experiencia:', error);
            throw error;
        }
    }

    // 🔥 SINCRONIZAR SKILLS DESDE EXPERIENCIA
    async syncSkillsFromExperience(experienceData) {
        try {
            if (!experienceData.technologies || !Array.isArray(experienceData.technologies)) {
                return;
            }

            console.log('🔄 Sincronizando skills desde experiencia:', experienceData.technologies);

            // Usar el skills-sync.js que crearemos después
            if (window.skillsSync) {
                await window.skillsSync.syncSkillsFromExperience(
                    experienceData.technologies, 
                    experienceData
                );
            } else {
                console.warn('SkillsSync no disponible, guardando skills básicas...');
                // Backup básico - guardar skills en el perfil
                await this.saveSkillsToProfile(experienceData.technologies);
            }

        } catch (error) {
            console.error('❌ Error sincronizando skills:', error);
        }
    }

    // Backup básico para guardar skills en el perfil
    async saveSkillsToProfile(technologies) {
        try {
            // Obtener skills actuales del perfil
            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('skills')
                .eq('id', this.currentUserId)
                .single();

            if (profileError) throw profileError;

            // Combinar skills existentes con nuevas
            const currentSkills = profile?.skills || [];
            const newSkills = [...new Set([...currentSkills, ...technologies])];

            // Actualizar perfil
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ 
                    skills: newSkills,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUserId);

            if (updateError) throw updateError;

            console.log('✅ Skills actualizadas en perfil:', newSkills);

            // Disparar evento para actualizar UI
            this.dispatchSkillsUpdated();

        } catch (error) {
            console.error('❌ Error guardando skills en perfil:', error);
        }
    }

    // Eliminar experiencia
    async deleteExperience(experienceId) {
        try {
            if (!this.currentUserId) {
                throw new Error('Usuario no autenticado');
            }

            if (!confirm('¿Estás seguro de que quieres eliminar esta experiencia?')) {
                return;
            }

            const { error } = await window.supabase
                .from('experiences')
                .delete()
                .eq('id', experienceId)
                .eq('user_id', this.currentUserId);

            if (error) {
                throw error;
            }

            console.log('🗑️ Experiencia eliminada:', experienceId);

            // Recargar experiencias
            await this.loadExperiences();

            this.showSuccessMessage('Experiencia eliminada');

        } catch (error) {
            console.error('❌ Error eliminando experiencia:', error);
            alert('Error al eliminar la experiencia: ' + error.message);
        }
    }

    // Obtener experiencia por ID
    getExperienceById(experienceId) {
        return this.experiences.find(exp => exp.id === experienceId);
    }

    // Obtener experiencias por tipo
    getExperiencesByType(type) {
        return this.experiences.filter(exp => exp.type === type);
    }

    // Obtener todas las tecnologías usadas en experiencias
    getAllTechnologies() {
        const allTech = this.experiences.flatMap(exp => 
            exp.technologies && Array.isArray(exp.technologies) ? exp.technologies : []
        );
        return [...new Set(allTech)];
    }

    // Calcular años de experiencia en una tecnología específica
    getTechnologyExperienceYears(technology) {
        const techExperiences = this.experiences.filter(exp =>
            exp.technologies && exp.technologies.includes(technology)
        );

        if (techExperiences.length === 0) return 0;

        // Calcular tiempo total (simplificado)
        let totalMonths = 0;

        techExperiences.forEach(exp => {
            const start = new Date(exp.start_date);
            const end = exp.current ? new Date() : new Date(exp.end_date);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                          (end.getMonth() - start.getMonth());
            totalMonths += Math.max(0, months);
        });

        return Math.round(totalMonths / 12 * 10) / 10; // Redondear a 1 decimal
    }

    // Disparar eventos para comunicación entre módulos
    dispatchExperiencesLoaded() {
        window.dispatchEvent(new CustomEvent('experiences-loaded', {
            detail: { experiences: this.experiences }
        }));
    }

    dispatchSkillsUpdated() {
        window.dispatchEvent(new CustomEvent('skills-updated'));
    }

    // Mostrar mensaje de éxito
    showSuccessMessage(message) {
        // Podemos mejorar esto con un toast notification después
        console.log('✅ ' + message);
        
        // Mostrar alerta temporal
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        alert.textContent = message;
        document.body.appendChild(alert);

        setTimeout(() => {
            document.body.removeChild(alert);
        }, 3000);
    }

    // Estadísticas de experiencias
    getExperienceStats() {
        const stats = {
            total: this.experiences.length,
            byType: {},
            current: this.experiences.filter(exp => exp.current).length,
            totalTechnologies: this.getAllTechnologies().length
        };

        // Contar por tipo
        this.experiences.forEach(exp => {
            stats.byType[exp.type] = (stats.byType[exp.type] || 0) + 1;
        });

        return stats;
    }
}



// Inicializar automáticamente cuando se carga el script
let experienceManager;

document.addEventListener('DOMContentLoaded', () => {
    experienceManager = new ExperienceManager();
    window.experienceManager = experienceManager;
    console.log('🚀 ExperienceManager listo');
});

// Exportar para uso global
window.ExperienceManager = ExperienceManager;