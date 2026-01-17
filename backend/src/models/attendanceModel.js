const supabase = require('../config/supabaseClient');

const AttendanceModel = {
    // Check if an attendance record exists for a specific user on a specific date
    async getAttendanceByDate(userId, date) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', userId)
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error;
        }
        return data; // Returns null if not found (when using .single() with error handling usually throws, but let's handle in controller or here)
    },

    // Create a new attendance record (Check In)
    async createAttendance(userId, checkInTime, date) {
        const { data, error } = await supabase
            .from('attendance')
            .insert([{
                employee_id: userId,
                date: date,
                check_in: checkInTime,
                status: 'Present'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update attendance record (Check Out)
    async updateAttendance(id, updates) {
        const { data, error } = await supabase
            .from('attendance')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get attendance history for a user
    async getAttendanceHistory(userId) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Helper to update the profile's present_status_of_employee
    async updateProfileStatus(userId, status) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ present_status_of_employee: status })
            .eq('id', userId);

        if (error) throw error;
        return data;
    }
};

module.exports = AttendanceModel;
