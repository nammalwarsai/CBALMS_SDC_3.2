import api from './api';

const notificationService = {
    // Get notifications for the logged-in user
    getNotifications: async (page = 1, limit = 20) => {
        const response = await api.get('/notifications', { params: { page, limit } });
        return response.data;
    },

    // Get unread notification count
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    // Mark a single notification as read
    markAsRead: async (notificationId) => {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    }
};

export default notificationService;
