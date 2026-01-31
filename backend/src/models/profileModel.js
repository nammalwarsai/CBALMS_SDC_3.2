const supabase = require('../config/supabaseClient');

// Helper function for retry logic
const withRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            if (error.message?.includes('timeout') || error.message?.includes('fetch failed')) {
                console.log(`Retry ${i + 1}/${retries} after connection error...`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            } else {
                throw error;
            }
        }
    }
};

const ProfileModel = {
    async getProfileById(id) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            return data;
        });
    },

    async updateProfile(id, updates) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        });
    },

    // Optimized count of all profiles
    async getProfileCount() {
        return withRetry(async () => {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        });
    },

    // Get basic profile info only (lighter payload)
    async getBasicProfiles() {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, employee_id, department, mobile_number, role, email'); // Exclude profile_photo

            if (error) throw error;
            return data;
        });
    },

    async createProfile(profileData) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .insert([profileData])
                .select()
                .single();
            if (error) throw error;
            return data;
        });
    },

    async getAllProfiles() {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');
            if (error) throw error;
            return data;
        });
    }
};

module.exports = ProfileModel;
