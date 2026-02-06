import api from './api';

const leaveBalanceService = {
    // Get leave balances for the logged-in employee
    getMyBalances: async (year) => {
        const params = year ? { year } : {};
        const response = await api.get('/leave-balances/my-balances', { params });
        return response.data;
    },

    // Admin: Get all employee balances
    getAllBalances: async (year) => {
        const params = year ? { year } : {};
        const response = await api.get('/leave-balances/all', { params });
        return response.data;
    }
};

export default leaveBalanceService;
