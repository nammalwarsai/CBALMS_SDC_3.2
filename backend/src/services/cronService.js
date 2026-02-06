const cron = require('node-cron');
const AttendanceModel = require('../models/attendanceModel');
const LeaveBalanceModel = require('../models/leaveBalanceModel');

const initCronJobs = () => {
    // Auto-checkout: configurable via environment variable
    const autoCheckoutSchedule = process.env.AUTO_CHECKOUT_CRON || '1 18 * * *';

    cron.schedule(autoCheckoutSchedule, async () => {
        console.log(`[${new Date().toISOString()}] Running daily auto-checkout job...`);
        try {
            const result = await AttendanceModel.processAutoCheckout();
            console.log('Auto-checkout result:', result);
        } catch (error) {
            console.error('Error in auto-checkout job:', error);
        }
    });

    // Leave accrual: run at midnight on the 1st of every month
    const leaveAccrualSchedule = process.env.LEAVE_ACCRUAL_CRON || '0 0 1 * *';

    cron.schedule(leaveAccrualSchedule, async () => {
        console.log(`[${new Date().toISOString()}] Running monthly leave accrual job...`);
        try {
            const result = await LeaveBalanceModel.accrueMonthlyLeave();
            console.log('Leave accrual result:', result);
        } catch (error) {
            console.error('Error in leave accrual job:', error);
        }
    });

    console.log(`Cron jobs initialized:`);
    console.log(`  - Auto-checkout: ${autoCheckoutSchedule}`);
    console.log(`  - Leave accrual: ${leaveAccrualSchedule}`);
};

module.exports = { initCronJobs };
