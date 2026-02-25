const supabase = require('../config/supabaseClient');

const AttendanceModel = {
    // Check if an attendance record exists for a specific user on a specific date
    async getAttendanceByDate(userId, date) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', userId)
            .eq('date', date)
            .maybeSingle();

        if (error) throw error;
        return data;
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

    // Get attendance history for a user with pagination
    async getAttendanceHistory(userId, page = 1, limit = 50) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact' })
            .eq('employee_id', userId)
            .order('date', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data || [], total: count || 0, page, limit };
    },

    // Get today's attendance records
    async getTodayAttendance(date) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('date', date);

        if (error) throw error;
        return data || [];
    },

    // Helper to update the profile's present_status_of_employee
    async updateProfileStatus(userId, status) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ present_status_of_employee: status })
            .eq('id', userId);

        if (error) throw error;
        return data;
    },

    // Get all attendance records within a date range with user details (Supabase join)
    async getAttendanceWithDetails(startDate, endDate) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*, profiles(full_name, employee_id, department, mobile_number)')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get count of present employees for a specific date
    async getPresentCount(date) {
        const { count, error } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('date', date);

        if (error) throw error;
        return count || 0;
    },

    // Auto-checkout logic - optimized with parallel batch updates
    async processAutoCheckout() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const checkoutTime = '06:00:00 PM';

        const { data: openRecords, error } = await supabase
            .from('attendance')
            .select('*')
            .is('check_out', null)
            .lte('date', today);

        if (error) {
            console.error("Error fetching open attendance records:", error);
            throw error;
        }

        if (!openRecords || openRecords.length === 0) return { message: "there are no open attendance records to auto-checkout." };

        // Filter records eligible for checkout
        const toCheckout = openRecords.filter(record => {
            if (record.date < today) return true;
            if (record.date === today && now.getHours() >= 18) return true;
            return false;
        });

        if (toCheckout.length === 0) return { message: "No records eligible for auto-checkout." };

        // Process all updates in parallel using Promise.allSettled
        const results = await Promise.allSettled(
            toCheckout.map(async (record) => {
                const [attResult, profResult] = await Promise.all([
                    supabase
                        .from('attendance')
                        .update({ check_out: checkoutTime, status: 'Present' })
                        .eq('id', record.id),
                    supabase
                        .from('profiles')
                        .update({ present_status_of_employee: 'Absent' })
                        .eq('id', record.employee_id)
                ]);
                if (attResult.error) throw attResult.error;
                if (profResult.error) throw profResult.error;
                return record.id;
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const errors = results
            .map((r, i) => r.status === 'rejected' ? {
                recordId: toCheckout[i].id,
                employeeId: toCheckout[i].employee_id,
                error: r.reason?.message
            } : null)
            .filter(Boolean);

        const message = `Auto-checked out ${successCount} employees successfully.${errors.length > 0 ? ` ${errors.length} failed.` : ''}`;
        return { message, errors: errors.length > 0 ? errors : undefined };
    }
};

module.exports = AttendanceModel;
