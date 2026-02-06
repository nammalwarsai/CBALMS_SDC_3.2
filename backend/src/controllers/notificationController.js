const NotificationModel = require('../models/notificationModel');

const notificationController = {
    // Get notifications for the logged-in user
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);

            const result = await NotificationModel.getNotifications(userId, page, limit);
            res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    },

    // Get unread notification count
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await NotificationModel.getUnreadCount(userId);
            res.status(200).json({ data: { unreadCount: count } });
        } catch (error) {
            next(error);
        }
    },

    // Mark a single notification as read
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const notification = await NotificationModel.markAsRead(id, userId);
            res.status(200).json({ message: 'Notification marked as read', data: notification });
        } catch (error) {
            next(error);
        }
    },

    // Mark all notifications as read
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            await NotificationModel.markAllAsRead(userId);
            res.status(200).json({ message: 'All notifications marked as read' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = notificationController;
