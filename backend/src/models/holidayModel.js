const supabase = require('../config/supabaseClient');

const HolidayModel = {
    // Get all holidays for a given year
    async getHolidaysByYear(year) {
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .eq('year', year)
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get holiday dates as a Set of YYYY-MM-DD strings for fast lookup
    async getHolidayDatesSet(year) {
        const holidays = await this.getHolidaysByYear(year);
        return new Set(holidays.map(h => h.date));
    },

    // Get holidays for a date range (may span years)
    async getHolidaysInRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get holiday date strings in a range as a Set
    async getHolidayDatesInRange(startDate, endDate) {
        const holidays = await this.getHolidaysInRange(startDate, endDate);
        return new Set(holidays.map(h => h.date));
    },

    // Check if a specific date is a holiday
    async isHoliday(date) {
        const { data, error } = await supabase
            .from('holidays')
            .select('id')
            .eq('date', date)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    // Create a new holiday
    async createHoliday(name, date, year, type = 'public') {
        const { data, error } = await supabase
            .from('holidays')
            .insert([{ name, date, year, type }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create multiple holidays at once
    async createHolidays(holidays) {
        const { data, error } = await supabase
            .from('holidays')
            .upsert(holidays, { onConflict: 'date' })
            .select();

        if (error) throw error;
        return data;
    },

    // Update a holiday
    async updateHoliday(id, updates) {
        const { data, error } = await supabase
            .from('holidays')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a holiday
    async deleteHoliday(id) {
        const { data, error } = await supabase
            .from('holidays')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = HolidayModel;
