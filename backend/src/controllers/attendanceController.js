const AttendanceModel = require('../models/attendanceModel');

// Standardized time formatting with explicit timezone
const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
};

const attendanceController = {
    async checkIn(req, res, next) {
        try {
            // SECURITY FIX: Use authenticated user ID from middleware, not from request body
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const timeString = formatTime(now);

            // Check for Weekend restriction (Sat/Sun)
            const dayOfWeek = now.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return res.status(400).json({ error: 'Cannot check in on weekends (Saturday/Sunday).' });
            }

            // Check if already checked in today
            const existingRecord = await AttendanceModel.getAttendanceByDate(userId, today);

            if (existingRecord) {
                return res.status(400).json({ error: 'Already checked in for today' });
            }

            // Check if user is on approved leave
            const onLeave = await require('../models/leaveModel').isUserOnLeave(userId, today);
            if (onLeave) {
                return res.status(400).json({ error: 'It is your leave period. You cannot check in.' });
            }

            // Create Attendance Record
            const newRecord = await AttendanceModel.createAttendance(userId, timeString, today);

            // Update Profile Status
            await AttendanceModel.updateProfileStatus(userId, 'Present');

            res.status(201).json({
                message: 'Checked in successfully',
                data: newRecord
            });

        } catch (error) {
            next(error);
        }
    },

    async checkOut(req, res, next) {
        try {
            // SECURITY FIX: Use authenticated user ID from middleware, not from request body
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const timeString = formatTime(now);

            // Get today's record
            const existingRecord = await AttendanceModel.getAttendanceByDate(userId, today);

            if (!existingRecord) {
                return res.status(400).json({ error: 'You have not checked in today' });
            }

            if (existingRecord.check_out) {
                return res.status(400).json({ error: 'Already checked out for today' });
            }

            // Update Record with Check Out time
            const updatedRecord = await AttendanceModel.updateAttendance(existingRecord.id, {
                check_out: timeString
            });

            // Update Profile Status
            await AttendanceModel.updateProfileStatus(userId, 'Absent');

            res.status(200).json({
                message: 'Checked out successfully',
                data: updatedRecord
            });

        } catch (error) {
            next(error);
        }
    },

    async getHistory(req, res, next) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            const history = await AttendanceModel.getAttendanceHistory(userId, page, limit);
            res.status(200).json({
                data: history.data,
                pagination: { total: history.total, page: history.page, limit: history.limit }
            });
        } catch (error) {
            next(error);
        }
    },

    async getStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const today = new Date().toISOString().split('T')[0];

            const record = await AttendanceModel.getAttendanceByDate(userId, today);

            let status = 'Not Checked In';
            if (record) {
                if (record.check_out) {
                    status = 'Checked Out';
                } else {
                    status = 'Checked In';
                }
            }

            res.status(200).json({ status: status, record: record });

        } catch (error) {
            next(error);
        }
    }
};

module.exports = attendanceController;
