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
    }
};

module.exports = adminController;
