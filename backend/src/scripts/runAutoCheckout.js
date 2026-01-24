const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const AttendanceModel = require('../models/attendanceModel');

const run = async () => {
    console.log('Starting manual auto-checkout process...');
    try {
        const result = await AttendanceModel.processAutoCheckout();
        console.log('Result:', result);
    } catch (error) {
        console.error('Error running manual auto-checkout:', error);
    }
    process.exit();
};

run();
