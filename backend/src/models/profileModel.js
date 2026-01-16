const supabase = require('../config/supabaseClient');

const ProfileModel = {
    async getProfileById(id) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createProfile(profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = ProfileModel;
