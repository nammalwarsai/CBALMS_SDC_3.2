const supabase = require('../config/supabaseClient');

const NotificationModel = {
    // Create a notification
    async createNotification(userId, title, message, type, relatedId = null) {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                related_id: relatedId
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create notifications for all admins
    async notifyAdmins(title, message, type, relatedId = null) {
        const { data: admins, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (adminError) throw adminError;
        if (!admins || admins.length === 0) return [];

        const notifications = admins.map(admin => ({
            user_id: admin.id,
            title,
            message,
            type,
            related_id: relatedId
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;
        return data;
    },

    // Get notifications for a user
    async getNotifications(userId, page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            notifications: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        };
    },

    // Get unread count for a user
    async getUnreadCount(userId) {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    // Mark a notification as read
    async markAsRead(notificationId, userId) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .select();

        if (error) throw error;
        return data;
    }
};

module.exports = NotificationModel;
