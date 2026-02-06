const ProfileModel = require('../models/profileModel');
const AttendanceModel = require('../models/attendanceModel');
const LeaveModel = require('../models/leaveModel');

const adminController = {
    // Get dashboard statistics
    async getDashboardStats(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const [totalEmployees, presentCount, onLeaveCount] = await Promise.all([
                ProfileModel.getProfileCount(),
                AttendanceModel.getPresentCount(today),
                LeaveModel.getApprovedLeavesCountForDate(today)
            ]);

            const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);

            res.status(200).json({
                data: {
                    totalEmployees,
                    presentToday: presentCount,
                    absentToday: absentCount,
                    onLeave: onLeaveCount
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Get list of present or absent employees
    async getAttendanceList(req, res, next) {
        try {
            const { type } = req.query;
            const today = new Date().toISOString().split('T')[0];

            if (!['present', 'absent'].includes(type)) {
                return res.status(400).json({ error: 'Invalid type. Use "present" or "absent"' });
            }

            const [allEmployees, todayAttendance] = await Promise.all([
                ProfileModel.getBasicProfiles(),
                AttendanceModel.getTodayAttendance(today)
            ]);

            const attendanceMap = new Map(todayAttendance.map(att => [att.employee_id, att]));

            let resultList = [];

            if (type === 'present') {
                resultList = allEmployees
                    .filter(emp => attendanceMap.has(emp.id))
                    .map(emp => ({
                        ...emp,
                        check_in: attendanceMap.get(emp.id)?.check_in || '-',
                        check_out: attendanceMap.get(emp.id)?.check_out || '-'
                    }));
            } else {
                resultList = allEmployees.filter(emp => !attendanceMap.has(emp.id));
            }

            res.status(200).json({ data: resultList });
        } catch (error) {
            next(error);
        }
    },

    async getAllEmployees(req, res, next) {
        try {
            const employees = await ProfileModel.getBasicProfiles();
            res.status(200).json({ data: employees });
        } catch (error) {
            next(error);
        }
    },

    async getEmployeeDetails(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await ProfileModel.getProfileById(id);

            if (!profile) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            let recentAttendance = [];
            try {
                const history = await AttendanceModel.getAttendanceHistory(id, 1, 5);
                recentAttendance = history.data;
            } catch (err) {
                console.error('Error fetching attendance for details:', err);
            }

            res.status(200).json({
                data: {
                    ...profile,
                    recentAttendance
                }
            });
        } catch (error) {
            next(error);
        }
    },

    async getAttendanceReport(req, res, next) {
        try {
            const { type, date } = req.query;

            let startDate, endDate;
            const today = new Date();

            if (type === 'daily') {
                const targetDate = date || today.toISOString().split('T')[0];
                startDate = targetDate;
                endDate = targetDate;
            } else if (type === 'monthly') {
                const priorDate = new Date(new Date().setDate(today.getDate() - 30));
                startDate = priorDate.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
            } else {
                return res.status(400).json({ error: 'Invalid report type. Use "daily" or "monthly"' });
            }

            const report = await AttendanceModel.getAttendanceWithDetails(startDate, endDate);

            if (type === 'daily') {
                const allEmployees = await ProfileModel.getAllProfiles();
                const attendanceMap = new Map(report.map(r => [r.employee_id, r]));

                const fullReport = allEmployees.map(emp => {
                    const att = attendanceMap.get(emp.id);
                    return {
                        full_name: emp.full_name,
                        employee_id: emp.employee_id,
                        department: emp.department,
                        mobile_number: emp.mobile_number,
                        attendance_status: att ? (att.check_out ? 'Present (Checked Out)' : 'Present') : 'Absent',
                        check_in: att?.check_in || '-',
                        check_out: att?.check_out || '-',
                        date: startDate
                    };
                });
                return res.status(200).json({ data: fullReport });
            }

            res.status(200).json({ data: report });

        } catch (error) {
            next(error);
        }
    }
};

module.exports = adminController;
