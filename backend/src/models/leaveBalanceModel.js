const supabase = require('../config/supabaseClient');

const LeaveBalanceModel = {
    // Get leave balances for an employee for the current year
    async getBalancesByEmployee(employeeId, year = new Date().getFullYear()) {
        const { data, error } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('year', year);

        if (error) throw error;
        return data || [];
    },

    // Get a specific leave balance
    async getBalance(employeeId, leaveType, year = new Date().getFullYear()) {
        const { data, error } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('leave_type', leaveType)
            .eq('year', year)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Check if employee has sufficient balance for a leave request
    async hasSufficientBalance(employeeId, leaveType, requestedDays, year = new Date().getFullYear()) {
        const balance = await this.getBalance(employeeId, leaveType, year);
        if (!balance) return false;
        return balance.remaining_days >= requestedDays;
    },

    // Initialize balances for a new employee
    async initializeBalances(employeeId, year = new Date().getFullYear()) {
        const defaults = [
            { employee_id: employeeId, leave_type: 'Sick', total_days: 12, used_days: 0, year },
            { employee_id: employeeId, leave_type: 'Casual', total_days: 10, used_days: 0, year },
            { employee_id: employeeId, leave_type: 'Earned', total_days: 15, used_days: 0, year }
        ];

        const { data, error } = await supabase
            .from('leave_balances')
            .upsert(defaults, { onConflict: 'employee_id,leave_type,year' })
            .select();

        if (error) throw error;
        return data;
    },

    // Accrue monthly leave (called by cron job at start of month)
    async accrueMonthlyLeave() {
        const year = new Date().getFullYear();

        // Monthly accrual rates: Sick=1/month, Casual=0.83/month, Earned=1.25/month
        // We initialize full balance at year start, so this is for mid-year joiners
        // For simplicity, ensure all employees have current year balances
        const { data: employees, error: empError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'employee');

        if (empError) throw empError;
        if (!employees || employees.length === 0) return { message: 'No employees found' };

        let initialized = 0;
        for (const emp of employees) {
            const existing = await this.getBalancesByEmployee(emp.id, year);
            if (existing.length === 0) {
                await this.initializeBalances(emp.id, year);
                initialized++;
            }
        }

        return { message: `Leave accrual complete. ${initialized} new balances initialized for ${year}.` };
    },

    // Get all employee balances (admin view)
    async getAllBalances(year = new Date().getFullYear()) {
        const { data, error } = await supabase
            .from('leave_balances')
            .select('*, profiles(full_name, employee_id, department, email)')
            .eq('year', year)
            .order('employee_id');

        if (error) throw error;
        return data || [];
    },

    // Deduct leave balance when a leave is approved
    async deductBalance(employeeId, leaveType, days, year = new Date().getFullYear()) {
        const balance = await this.getBalance(employeeId, leaveType, year);
        if (!balance) throw new Error(`No leave balance found for type ${leaveType}`);

        const newUsed = balance.used_days + days;
        const newRemaining = balance.total_days - newUsed;

        const { data, error } = await supabase
            .from('leave_balances')
            .update({ used_days: newUsed, remaining_days: newRemaining })
            .eq('id', balance.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Restore leave balance when an approved leave is cancelled
    async restoreBalance(employeeId, leaveType, days, year = new Date().getFullYear()) {
        const balance = await this.getBalance(employeeId, leaveType, year);
        if (!balance) throw new Error(`No leave balance found for type ${leaveType}`);

        const newUsed = Math.max(0, balance.used_days - days);
        const newRemaining = balance.total_days - newUsed;

        const { data, error } = await supabase
            .from('leave_balances')
            .update({ used_days: newUsed, remaining_days: newRemaining })
            .eq('id', balance.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = LeaveBalanceModel;
