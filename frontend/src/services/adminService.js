import api from './api';

const adminService = {
    getAllEmployees: async () => {
        const response = await api.get('/admin/employees');
        return response.data;
    },

    getEmployeeDetails: async (id) => {
        const response = await api.get(`/admin/employees/${id}`);
        return response.data;
    }
};

export default adminService;
