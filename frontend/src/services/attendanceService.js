import api from './api';

const attendanceService = {
    checkIn: async () => {
        const response = await api.post('/attendance/check-in', {});
        return response.data;
    },

    checkOut: async () => {
        const response = await api.post('/attendance/check-out', {});
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
