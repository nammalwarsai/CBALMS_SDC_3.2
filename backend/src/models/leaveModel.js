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

    // Get all leaves for a specific employee
    async getLeavesByEmployee(employeeId) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get all leave requests (for admin)
    async getAllLeaves() {
        // First get all leaves
        const { data: leaves, error } = await supabase
            .from('leaves')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Get unique employee IDs
        const employeeIds = [...new Set(leaves.map(l => l.employee_id))];
        
        // Fetch profiles for these employees
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, employee_id, department, email')
            .in('id', employeeIds);
        
        if (profileError) throw profileError;
        
        // Map profiles to leaves
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const leavesWithProfiles = leaves.map(leave => ({
            ...leave,
            profiles: profileMap.get(leave.employee_id) || null
        }));
        
        return leavesWithProfiles || [];
    },

    // Get pending leave requests (for admin)
    async getPendingLeaves() {
        // First get pending leaves
        const { data: leaves, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('status', 'Pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (!leaves || leaves.length === 0) return [];
        
        // Get unique employee IDs
        const employeeIds = [...new Set(leaves.map(l => l.employee_id))];
        
        // Fetch profiles for these employees
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, employee_id, department, email')
            .in('id', employeeIds);
        
        if (profileError) throw profileError;
        
        // Map profiles to leaves
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const leavesWithProfiles = leaves.map(leave => ({
            ...leave,
            profiles: profileMap.get(leave.employee_id) || null
        }));
        
        return leavesWithProfiles || [];
    },

    // Get today's approved leaves
    async getTodayLeaves(date) {
        const { data: leaves, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('status', 'Approved')
            .lte('start_date', date)
            .gte('end_date', date);

        if (error) throw error;
        
        if (!leaves || leaves.length === 0) return [];
        
        // Get unique employee IDs
        const employeeIds = [...new Set(leaves.map(l => l.employee_id))];
        
        // Fetch profiles for these employees
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, employee_id, department, email')
            .in('id', employeeIds);
        
        if (profileError) throw profileError;
        
        // Map profiles to leaves
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const leavesWithProfiles = leaves.map(leave => ({
            ...leave,
            profiles: profileMap.get(leave.employee_id) || null
        }));
        
        return leavesWithProfiles || [];
    },

    // Update leave status (approve/reject)
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
            .select()
            .single();

        if (error) throw error;
        
        // Fetch profile for this leave
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, employee_id, department, email')
            .eq('id', data.employee_id)
            .single();
        
        return { ...data, profiles: profile || null };
    },

    // Get leave by ID
    async getLeaveById(leaveId) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('id', leaveId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        if (!data) return null;
        
        // Fetch profile for this leave
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, employee_id, department, email')
            .eq('id', data.employee_id)
            .single();
        
        return { ...data, profiles: profile || null };
    },

    // Get approved leaves count for today (for dashboard stats)
    async getApprovedLeavesCountForDate(date) {
        const { data, error } = await supabase
            .from('leaves')
            .select('id', { count: 'exact' })
            .eq('status', 'Approved')
            .lte('start_date', date)
            .gte('end_date', date);

        if (error) throw error;
        return data?.length || 0;
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
    }
};

module.exports = LeaveModel;
