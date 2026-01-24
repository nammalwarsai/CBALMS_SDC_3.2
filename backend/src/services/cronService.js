const cron = require('node-cron');
const AttendanceModel = require('../models/attendanceModel');

const initCronJobs = () => {
    // Run everyday at 18:01 (6:01 PM)
    cron.schedule('1 18 * * *', async () => {
        console.log('Running daily auto-checkout job...');
        try {
            const result = await AttendanceModel.processAutoCheckout();
            console.log('Auto-checkout result:', result);
        } catch (error) {
            console.error('Error in auto-checkout job:', error);
        }
    });

    console.log('Cron jobs initialized: Auto-checkout scheduled for 18:01 daily.');
};

module.exports = { initCronJobs };
