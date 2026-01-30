const LeaveModel = require('../models/leaveModel');

const leaveController = {
    // Employee: Apply for leave
    async applyLeave(req, res) {
        try {
            const { leaveType, startDate, endDate, reason } = req.body;
            const employeeId = req.user.id; // From auth middleware

            // Validation
            if (!leaveType || !startDate || !endDate) {
                return res.status(400).json({ error: 'Leave type, start date, and end date are required' });
            }

            // Check if end date is after start date
            if (new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ error: 'End date must be after or equal to start date' });
            }

            const leave = await LeaveModel.createLeave(employeeId, leaveType, startDate, endDate, reason);
            
            res.status(201).json({
                message: 'Leave request submitted successfully',
                data: leave
            });
        } catch (error) {
            console.error('Apply Leave Error:', error);
            res.status(500).json({ error: 'Server error applying for leave' });
        }
    },

    // Employee: Get my leave history
    async getMyLeaves(req, res) {
        try {
            const employeeId = req.user.id;
            const leaves = await LeaveModel.getLeavesByEmployee(employeeId);
            
            res.status(200).json({ data: leaves });
        } catch (error) {
            console.error('Get My Leaves Error:', error);
            res.status(500).json({ error: 'Server error fetching leave history' });
        }
    },

    // Employee: Cancel a pending leave request
    async cancelLeave(req, res) {
        try {
            const { id } = req.params;
            const employeeId = req.user.id;

            const leave = await LeaveModel.deleteLeave(id, employeeId);
            
            if (!leave) {
                return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
            }

            res.status(200).json({
                message: 'Leave request cancelled successfully',
                data: leave
            });
        } catch (error) {
            console.error('Cancel Leave Error:', error);
            res.status(500).json({ error: 'Server error cancelling leave request' });
        }
    },

    // Admin: Get all leave requests
    async getAllLeaves(req, res) {
        try {
            const { status } = req.query; // Optional filter: 'Pending', 'Approved', 'Rejected'
            
            let leaves;
            if (status === 'Pending') {
                leaves = await LeaveModel.getPendingLeaves();
            } else {
                leaves = await LeaveModel.getAllLeaves();
                if (status) {
                    leaves = leaves.filter(l => l.status === status);
                }
            }
            
            res.status(200).json({ data: leaves });
        } catch (error) {
            console.error('Get All Leaves Error:', error.message, error.code, error.details);
            res.status(500).json({ error: 'Server error fetching leave requests', details: error.message });
        }
    },

    // Admin: Get today's leaves (employees on leave today)
    async getTodayLeaves(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const leaves = await LeaveModel.getTodayLeaves(today);
            
            res.status(200).json({ data: leaves });
        } catch (error) {
            console.error('Get Today Leaves Error:', error.message, error.code, error.details);
            res.status(500).json({ error: 'Server error fetching today\'s leaves', details: error.message });
        }
    },

    // Admin: Approve or reject a leave request
    async updateLeaveStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            const adminId = req.user.id;

            // Validate status
            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Use "Approved" or "Rejected"' });
            }

            // Check if leave exists
            const existingLeave = await LeaveModel.getLeaveById(id);
            if (!existingLeave) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            if (existingLeave.status !== 'Pending') {
                return res.status(400).json({ error: 'This leave request has already been processed' });
            }

            const updatedLeave = await LeaveModel.updateLeaveStatus(id, status, adminId, remarks);
            
            res.status(200).json({
                message: `Leave request ${status.toLowerCase()} successfully`,
                data: updatedLeave
            });
        } catch (error) {
            console.error('Update Leave Status Error:', error);
            res.status(500).json({ error: 'Server error updating leave status' });
        }
    },

    // Admin: Get leave details by ID
    async getLeaveDetails(req, res) {
        try {
            const { id } = req.params;
            const leave = await LeaveModel.getLeaveById(id);
            
            if (!leave) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            res.status(200).json({ data: leave });
        } catch (error) {
            console.error('Get Leave Details Error:', error);
            res.status(500).json({ error: 'Server error fetching leave details' });
        }
    }
};

module.exports = leaveController;
