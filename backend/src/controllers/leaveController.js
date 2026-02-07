const LeaveModel = require('../models/leaveModel');
const LeaveBalanceModel = require('../models/leaveBalanceModel');
const NotificationModel = require('../models/notificationModel');

// Helper: calculate working days between two dates
const calculateWorkingDays = (startDate, endDate) => {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
};

const leaveController = {
    // Employee: Apply for leave
    async applyLeave(req, res, next) {
        try {
            const { leaveType, startDate, endDate, reason } = req.body;
            const employeeId = req.user.id;

            if (!leaveType || !startDate || !endDate) {
                return res.status(400).json({ error: 'Leave type, start date, and end date are required' });
            }

            if (new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ error: 'End date must be after or equal to start date' });
            }

            // Check leave balance before creating request
            const requestedDays = calculateWorkingDays(startDate, endDate);
            const year = new Date(startDate).getFullYear();
            const hasSufficient = await LeaveBalanceModel.hasSufficientBalance(employeeId, leaveType, requestedDays, year);

            if (!hasSufficient) {
                const balance = await LeaveBalanceModel.getBalance(employeeId, leaveType, year);
                const remaining = balance ? balance.remaining_days : 0;
                return res.status(400).json({
                    error: `Insufficient ${leaveType} leave balance. You have ${remaining} day(s) remaining but requested ${requestedDays} day(s).`
                });
            }

            const leave = await LeaveModel.createLeave(employeeId, leaveType, startDate, endDate, reason);

            // Attach computed working days so frontend doesn't need to recalculate (CQ-04)
            leave.working_days = requestedDays;

            // Notify all admins about the new leave request
            try {
                const employeeName = req.user.full_name || req.user.name || 'An employee';
                await NotificationModel.notifyAdmins(
                    'New Leave Request',
                    `${employeeName} has submitted a ${leaveType} leave request from ${startDate} to ${endDate}.`,
                    'leave_request',
                    leave.id
                );
            } catch (notifError) {
                console.error('Failed to send notification:', notifError);
            }

            res.status(201).json({
                message: 'Leave request submitted successfully',
                data: leave
            });
        } catch (error) {
            next(error);
        }
    },

    // Employee: Get my leave history
    async getMyLeaves(req, res, next) {
        try {
            const employeeId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            const result = await LeaveModel.getLeavesByEmployee(employeeId, page, limit);
            res.status(200).json({
                data: result.data,
                pagination: { total: result.total, page: result.page, limit: result.limit }
            });
        } catch (error) {
            next(error);
        }
    },

    // Employee: Cancel a leave request (pending or approved)
    async cancelLeave(req, res, next) {
        try {
            const { id } = req.params;
            const employeeId = req.user.id;

            // First, fetch the leave to check its status
            const existingLeave = await LeaveModel.getLeaveById(id);
            if (!existingLeave || existingLeave.employee_id !== employeeId) {
                return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
            }

            if (existingLeave.status !== 'Pending' && existingLeave.status !== 'Approved') {
                return res.status(400).json({ error: 'Only pending or approved leave requests can be cancelled' });
            }

            // If the leave was approved, restore the balance before deleting
            if (existingLeave.status === 'Approved') {
                const workingDays = calculateWorkingDays(existingLeave.start_date, existingLeave.end_date);
                const year = new Date(existingLeave.start_date).getFullYear();
                await LeaveBalanceModel.restoreBalance(employeeId, existingLeave.leave_type, workingDays, year);
            }

            const leave = await LeaveModel.deleteLeave(id, employeeId);

            if (!leave) {
                return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
            }

            res.status(200).json({
                message: 'Leave request cancelled successfully',
                data: leave
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get all leave requests
    async getAllLeaves(req, res, next) {
        try {
            const { status } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            let result;
            if (status === 'Pending') {
                result = await LeaveModel.getPendingLeaves(page, limit);
            } else {
                result = await LeaveModel.getAllLeaves(page, limit);
                if (status && status !== 'Pending') {
                    result.data = result.data.filter(l => l.status === status);
                }
            }

            res.status(200).json({
                data: result.data,
                pagination: { total: result.total, page: result.page, limit: result.limit }
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get today's leaves
    async getTodayLeaves(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const leaves = await LeaveModel.getTodayLeaves(today);
            res.status(200).json({ data: leaves });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Approve or reject a leave request
    async updateLeaveStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            const adminId = req.user.id;

            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Use "Approved" or "Rejected"' });
            }

            const existingLeave = await LeaveModel.getLeaveById(id);
            if (!existingLeave) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            if (existingLeave.status !== 'Pending') {
                return res.status(400).json({ error: 'This leave request has already been processed' });
            }

            const updatedLeave = await LeaveModel.updateLeaveStatus(id, status, adminId, remarks);

            // Deduct leave balance when approved
            if (status === 'Approved') {
                const workingDays = calculateWorkingDays(existingLeave.start_date, existingLeave.end_date);
                const year = new Date(existingLeave.start_date).getFullYear();
                await LeaveBalanceModel.deductBalance(existingLeave.employee_id, existingLeave.leave_type, workingDays, year);
            }

            // Notify the employee about the decision
            try {
                const statusText = status === 'Approved' ? 'approved' : 'rejected';
                const adminName = req.user.full_name || 'Admin';
                await NotificationModel.createNotification(
                    existingLeave.employee_id,
                    `Leave ${status}`,
                    `Your ${existingLeave.leave_type} leave request (${existingLeave.start_date} to ${existingLeave.end_date}) has been ${statusText} by ${adminName}.${remarks ? ' Remarks: ' + remarks : ''}`,
                    status === 'Approved' ? 'leave_approved' : 'leave_rejected',
                    id
                );
            } catch (notifError) {
                console.error('Failed to send notification:', notifError);
            }

            res.status(200).json({
                message: `Leave request ${status.toLowerCase()} successfully`,
                data: updatedLeave
            });
        } catch (error) {
            next(error);
        }
    },

    // Get leave details by ID
    async getLeaveDetails(req, res, next) {
        try {
            const { id } = req.params;
            const leave = await LeaveModel.getLeaveById(id);

            if (!leave) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            res.status(200).json({ data: leave });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = leaveController;
