const ProfileModel = require('../models/profileModel');
const AttendanceModel = require('../models/attendanceModel');

const adminController = {
    async getAllEmployees(req, res) {
        try {
            const employees = await ProfileModel.getAllProfiles();
            // Filter out admins if necessary, or just return all
            // const nonAdmins = employees.filter(emp => emp.role !== 'admin');
            res.status(200).json({ data: employees });
        } catch (error) {
            console.error('Get All Employees Error:', error);
            res.status(500).json({ error: 'Server error fetching employees' });
        }
    },

    async getEmployeeDetails(req, res) {
        try {
            const { id } = req.params;
            const profile = await ProfileModel.getProfileById(id);

            if (!profile) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Optional: Fetch recent attendance history or stats
            let recentAttendance = [];
            try {
                recentAttendance = await AttendanceModel.getAttendanceHistory(id);
                // Limit to last 5 records
                recentAttendance = recentAttendance.slice(0, 5);
            } catch (err) {
                console.error('Error fetching attendance for details:', err);
                // Continue without attendance if it fails
            }

            res.status(200).json({
                data: {
                    ...profile,
                    recentAttendance
                }
            });
        } catch (error) {
            console.error('Get Employee Details Error:', error);
            res.status(500).json({ error: 'Server error fetching employee details' });
        }
    },

    async getAttendanceReport(req, res) {
        try {
            const { type, date } = req.query; // type: 'daily' or 'monthly'

            let startDate, endDate;
            const today = new Date();

            if (type === 'daily') {
                // specific date or today
                const targetDate = date || today.toISOString().split('T')[0];
                startDate = targetDate;
                endDate = targetDate;
            } else if (type === 'monthly') {
                // Last 30 days
                const priorDate = new Date(new Date().setDate(today.getDate() - 30));
                startDate = priorDate.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
            } else {
                return res.status(400).json({ error: 'Invalid report type' });
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
            console.error('Get Report Error:', error);
            res.status(500).json({ error: 'Server error generating report' });
        }
    }
};

module.exports = adminController;
