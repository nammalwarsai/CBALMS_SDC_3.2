import api from './api';

const adminService = {
    getDashboardStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getAttendanceList: async (type) => {
        const response = await api.get('/admin/attendance-list', { params: { type } });
        return response.data;
    },

    getAllEmployees: async () => {
        const response = await api.get('/admin/employees');
        return response.data;
    },

    getEmployeeDetails: async (id) => {
        const response = await api.get(`/admin/employees/${id}`);
        return response.data;
    },

    getAttendanceReport: async (type, date) => {
        const response = await api.get('/admin/reports', { params: { type, date } });
        return response.data;
    }
};

export default adminService;
