import api from './api';

const holidayService = {
    // Get all holidays for a year
    getHolidays: async (year) => {
        const params = year ? { year } : {};
        const response = await api.get('/holidays', { params });
        return response.data;
    },

    // Check if a date is a holiday
    checkDate: async (date) => {
        const response = await api.get('/holidays/check', { params: { date } });
        return response.data;
    },

    // Admin: Create a holiday
    createHoliday: async (name, date, type = 'public') => {
        const response = await api.post('/holidays', { name, date, type });
        return response.data;
    },

    // Admin: Seed default holidays for a year
    seedHolidays: async (year) => {
        const response = await api.post('/holidays/seed', { year });
        return response.data;
    },

    // Admin: Update a holiday
    updateHoliday: async (id, updates) => {
        const response = await api.put(`/holidays/${id}`, updates);
        return response.data;
    },

    // Admin: Delete a holiday
    deleteHoliday: async (id) => {
        const response = await api.delete(`/holidays/${id}`);
        return response.data;
    }
};

export default holidayService;
