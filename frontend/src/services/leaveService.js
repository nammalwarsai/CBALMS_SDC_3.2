import api from './api';

const leaveService = {
    // Employee: Apply for leave
    applyLeave: async (leaveData) => {
        const response = await api.post('/leaves/apply', leaveData);
        return response.data;
    },

    // Employee: Get my leave history
    getMyLeaves: async () => {
        const response = await api.get('/leaves/my-leaves');
        return response.data;
    },

    // Employee: Cancel a pending leave request
    cancelLeave: async (leaveId) => {
        const response = await api.delete(`/leaves/cancel/${leaveId}`);
        return response.data;
    },

    // Admin: Get all leave requests (with optional status filter)
    getAllLeaves: async (status = null) => {
        const params = status ? { status } : {};
        const response = await api.get('/leaves/all', { params });
        return response.data;
    },

    // Admin: Get today's leaves
    getTodayLeaves: async () => {
        const response = await api.get('/leaves/today');
        return response.data;
    },

    // Admin: Approve a leave request
    approveLeave: async (leaveId, remarks = null) => {
        const response = await api.put(`/leaves/${leaveId}/status`, { 
            status: 'Approved',
            remarks 
        });
        return response.data;
    },

    // Admin: Reject a leave request
    rejectLeave: async (leaveId, remarks = null) => {
        const response = await api.put(`/leaves/${leaveId}/status`, { 
            status: 'Rejected',
            remarks 
        });
        return response.data;
    },

    // Get leave details by ID
    getLeaveDetails: async (leaveId) => {
        const response = await api.get(`/leaves/${leaveId}`);
        return response.data;
    }
};

export default leaveService;
