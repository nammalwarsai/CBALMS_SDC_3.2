import api from './api';

const attendanceService = {
    checkIn: async (userId) => {
        const response = await api.post('/attendance/check-in', { userId });
        return response.data;
    },

    checkOut: async (userId) => {
        const response = await api.post('/attendance/check-out', { userId });
        return response.data;
    },

    getHistory: async (userId) => {
        const response = await api.get(`/attendance/history/${userId}`);
        return response.data;
    },

    getStatus: async (userId) => {
        const response = await api.get(`/attendance/status/${userId}`);
        return response.data;
    }
};

export default attendanceService;
