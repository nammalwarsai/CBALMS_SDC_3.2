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

    // Get all attendance records within a date range with user details
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
        // We select distinct employee_ids for the given date
        // Since Supabase .count() with head:true doesn't support distinct easily on the client side without RPC
        // We will fetch just the employee_ids and count unique ones.
        // Or better yet, rely on the fact that an employee can only check in once per day (as per rules),
        // so we can just count the rows.

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
        const checkoutTime = '18:00:00'; // 6:00 PM

        // 1. Fetch all records where check_out is NULL
        // We will filter in application logic for more complex date usage or let Supabase filter if possible.
        // For simplicity and correctness with timezones, let's fetch 'Present' or null checkout records.
        const { data: openRecords, error } = await supabase
            .from('attendance')
            .select('*')
            .is('check_out', null);

        if (error) {
            console.error("Error fetching open attendance records:", error);
            throw error;
        }

        if (!openRecords || openRecords.length === 0) return { message: "No open records found." };

        const updates = [];
        for (const record of openRecords) {
            // Check if record needs auto-checkout
            // Condition: Date is BEFORE today OR (Date is TODAY AND Current Time > 18:00)
            const recordDate = record.date;

            let shouldCheckout = false;

            if (recordDate < today) {
                shouldCheckout = true;
            } else if (recordDate === today) {
                // Check if current time is past 18:00
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                // 18:00 implies hour >= 18. If exactly 18:00 we might want to wait until 18:01 to be safe, but >= 18 is fine.
                if (currentHour >= 18) {
                    shouldCheckout = true;
                }
            }

            if (shouldCheckout) {
                // Update Attendance Record
                const updateAttendance = supabase
                    .from('attendance')
                    .update({
                        check_out: checkoutTime,
                        status: 'Present' // explicit, though likely already Present
                    })
                    .eq('id', record.id);

                // Update Profile Status (mark as Absent since they are now checked out)
                const updateProfile = supabase
                    .from('profiles')
                    .update({ present_status_of_employee: 'Absent' })
                    .eq('id', record.employee_id);

                updates.push(updateAttendance);
                updates.push(updateProfile);
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            return { message: `Auto-checked out ${updates.length / 2} employees.` };
        } else {
            return { message: "No employees needed auto-checkout." };
        }
    }
};

module.exports = AttendanceModel;
