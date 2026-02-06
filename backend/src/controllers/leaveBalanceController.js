const LeaveBalanceModel = require('../models/leaveBalanceModel');

const leaveBalanceController = {
    // Employee: Get my leave balances
    async getMyBalances(req, res, next) {
        try {
            const employeeId = req.user.id;
            const year = parseInt(req.query.year) || new Date().getFullYear();

            const balances = await LeaveBalanceModel.getBalancesByEmployee(employeeId, year);

            // If no balances exist for this year, initialize them
            if (balances.length === 0) {
                const initialized = await LeaveBalanceModel.initializeBalances(employeeId, year);
                return res.status(200).json({ data: initialized });
            }

            res.status(200).json({ data: balances });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get all employee balances
    async getAllBalances(req, res, next) {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const balances = await LeaveBalanceModel.getAllBalances(year);
            res.status(200).json({ data: balances });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = leaveBalanceController;
