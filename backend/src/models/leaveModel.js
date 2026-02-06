const supabase = require('../config/supabaseClient');

const LeaveModel = {
    // Create a new leave request
    async createLeave(employeeId, leaveType, startDate, endDate, reason) {
        const { data, error } = await supabase
            .from('leaves')
            .insert([{
                employee_id: employeeId,
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason,
                status: 'Pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get all leaves for a specific employee with pagination
    async getLeavesByEmployee(employeeId, page = 1, limit = 50) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('leaves')
            .select('*', { count: 'exact' })
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data || [], total: count || 0, page, limit };
    },

    // Get all leave requests using Supabase join (optimized - single query)
    async getAllLeaves(page = 1, limit = 50) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('leaves')
            .select('*, profiles!employee_id(full_name, employee_id, department, email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data || [], total: count || 0, page, limit };
    },

    // Get pending leave requests using Supabase join (optimized)
    async getPendingLeaves(page = 1, limit = 50) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('leaves')
            .select('*, profiles!employee_id(full_name, employee_id, department, email)', { count: 'exact' })
            .eq('status', 'Pending')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data || [], total: count || 0, page, limit };
    },

    // Get today's approved leaves using Supabase join (optimized)
    async getTodayLeaves(date) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*, profiles!employee_id(full_name, employee_id, department, email)')
            .eq('status', 'Approved')
            .lte('start_date', date)
            .gte('end_date', date);

        if (error) throw error;
        return data || [];
    },

    // Update leave status using Supabase join (optimized)
    async updateLeaveStatus(leaveId, status, adminId, adminRemarks = null) {
        const { data, error } = await supabase
            .from('leaves')
            .update({
                status: status,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString(),
                admin_remarks: adminRemarks
            })
            .eq('id', leaveId)
            .select('*, profiles!employee_id(full_name, employee_id, department, email)')
            .single();

        if (error) throw error;
        return data;
    },

    // Get leave by ID using Supabase join (optimized)
    async getLeaveById(leaveId) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*, profiles!employee_id(full_name, employee_id, department, email)')
            .eq('id', leaveId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Get approved leaves count for today (for dashboard stats)
    async getApprovedLeavesCountForDate(date) {
        const { count, error } = await supabase
            .from('leaves')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Approved')
            .lte('start_date', date)
            .gte('end_date', date);

        if (error) throw error;
        return count || 0;
    },

    // Delete a leave request (only if pending)
    async deleteLeave(leaveId, employeeId) {
        const { data, error } = await supabase
            .from('leaves')
            .delete()
            .eq('id', leaveId)
            .eq('employee_id', employeeId)
            .eq('status', 'Pending')
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Check if user is on approved leave for a specific date
    async isUserOnLeave(userId, date) {
        const { data, error } = await supabase
            .from('leaves')
            .select('id')
            .eq('employee_id', userId)
            .eq('status', 'Approved')
            .lte('start_date', date)
            .gte('end_date', date)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }
};

module.exports = LeaveModel;
