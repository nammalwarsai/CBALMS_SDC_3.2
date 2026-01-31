const AttendanceModel = require('../models/attendanceModel');

const attendanceController = {
    async checkIn(req, res) {
        try {
            const { userId } = req.body; // or from req.user.id if middleware adds it
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: true }); // e.g., "09:00 AM"

            // 0. Check for Weekend restriction (Sat/Sun)
            const dayOfWeek = now.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return res.status(400).json({ error: 'Cannot check in on weekends (Saturday/Sunday).' });
            }

            // 1. Check if already checked in today
            const existingRecord = await AttendanceModel.getAttendanceByDate(userId, today);

            if (existingRecord) {
                return res.status(400).json({ error: 'Already checked in for today' });
            }

            // 1.5 Check if user is on approved leave
            const onLeave = await require('../models/leaveModel').isUserOnLeave(userId, today);
            if (onLeave) {
                return res.status(400).json({ error: 'It is your leave period. You cannot check in.' });
            }

            // 2. Create Attendance Record
            const newRecord = await AttendanceModel.createAttendance(userId, timeString, today);

            // 3. Update Profile Status
            await AttendanceModel.updateProfileStatus(userId, 'Present');

            res.status(201).json({
                message: 'Checked in successfully',
                data: newRecord
            });

        } catch (error) {
            console.error('Check-in Error:', error);
            res.status(500).json({ error: 'Server error during check-in' });
        }
    },

    async checkOut(req, res) {
        try {
            const { userId } = req.body;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: true });

            // 1. Get today's record
            const existingRecord = await AttendanceModel.getAttendanceByDate(userId, today);

            if (!existingRecord) {
                return res.status(400).json({ error: 'You have not checked in today' });
            }

            if (existingRecord.check_out) {
                return res.status(400).json({ error: 'Already checked out for today' });
            }

            // 2. Update Record with Check Out time
            const updatedRecord = await AttendanceModel.updateAttendance(existingRecord.id, {
                check_out: timeString
            });

            // 3. Update Profile Status
            await AttendanceModel.updateProfileStatus(userId, 'Absent'); // Or 'Checked Out'

            res.status(200).json({
                message: 'Checked out successfully',
                data: updatedRecord
            });

        } catch (error) {
            console.error('Check-out Error:', error);
            res.status(500).json({ error: 'Server error during check-out' });
        }
    },

    async getHistory(req, res) {
        try {
            const { userId } = req.params;
            const history = await AttendanceModel.getAttendanceHistory(userId);
            res.status(200).json({ data: history });
        } catch (error) {
            console.error('Get History Error:', error);
            res.status(500).json({ error: 'Server error fetching history' });
        }
    },

    async getStatus(req, res) {
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
            console.error('Get Status Error:', error);
            res.status(500).json({ error: 'Server error fetching status' });
        }
    }
};

module.exports = attendanceController;
