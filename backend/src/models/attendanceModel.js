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

    // Auto-checkout logic
    async processAutoCheckout() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const checkoutTime = '06:00:00 PM';

        // Only fetch open records up to today (date guard to avoid scanning entire history)
        const { data: openRecords, error } = await supabase
            .from('attendance')
            .select('*')
            .is('check_out', null)
            .lte('date', today);

        if (error) {
            console.error("Error fetching open attendance records:", error);
            throw error;
        }

        if (!openRecords || openRecords.length === 0) return { message: "No open records found." };

        let successCount = 0;
        const errors = [];

        for (const record of openRecords) {
            const recordDate = record.date;
            let shouldCheckout = false;

            if (recordDate < today) {
                shouldCheckout = true;
            } else if (recordDate === today) {
                const currentHour = now.getHours();
                if (currentHour >= 18) {
                    shouldCheckout = true;
                }
            }

            if (shouldCheckout) {
                try {
                    const { error: attError } = await supabase
                        .from('attendance')
                        .update({
                            check_out: checkoutTime,
                            status: 'Present'
                        })
                        .eq('id', record.id);

                    if (attError) throw attError;

                    const { error: profError } = await supabase
                        .from('profiles')
                        .update({ present_status_of_employee: 'Absent' })
                        .eq('id', record.employee_id);

                    if (profError) throw profError;

                    successCount++;
                } catch (updateError) {
                    console.error(`Auto-checkout failed for record ${record.id} (employee ${record.employee_id}):`, updateError);
                    errors.push({ recordId: record.id, employeeId: record.employee_id, error: updateError.message });
                }
            }
        }

        const message = `Auto-checked out ${successCount} employees.${errors.length > 0 ? ` ${errors.length} failed.` : ''}`;
        return { message, errors: errors.length > 0 ? errors : undefined };
    }
};

module.exports = AttendanceModel;
