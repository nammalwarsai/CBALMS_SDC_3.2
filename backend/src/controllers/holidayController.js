const HolidayModel = require('../models/holidayModel');

const holidayController = {
    // Get all holidays for a year
    async getHolidays(req, res, next) {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const holidays = await HolidayModel.getHolidaysByYear(year);
            res.status(200).json({ data: holidays });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Create a holiday
    async createHoliday(req, res, next) {
        try {
            const { name, date, type } = req.body;
            if (!name || !date) {
                return res.status(400).json({ error: 'Holiday name and date are required' });
            }
            const holidayType = type === 'bonus' ? 'bonus' : 'public';
            const year = new Date(date).getFullYear();
            const holiday = await HolidayModel.createHoliday(name, date, year, holidayType);
            res.status(201).json({ message: 'Holiday created successfully', data: holiday });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'A holiday already exists on this date' });
            }
            next(error);
        }
    },

    // Admin: Seed default holidays for a year
    async seedHolidays(req, res, next) {
        try {
            const year = parseInt(req.body.year) || new Date().getFullYear();
            const defaults = getDefaultHolidays(year);
            const holidays = await HolidayModel.createHolidays(defaults);
            res.status(201).json({
                message: `${holidays.length} holidays seeded for ${year}`,
                data: holidays
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Update a holiday
    async updateHoliday(req, res, next) {
        try {
            const { id } = req.params;
            const { name, date, type } = req.body;
            const updates = {};
            if (name) updates.name = name;
            if (date) {
                updates.date = date;
                updates.year = new Date(date).getFullYear();
            }
            if (type) updates.type = type === 'bonus' ? 'bonus' : 'public';
            const holiday = await HolidayModel.updateHoliday(id, updates);
            res.status(200).json({ message: 'Holiday updated successfully', data: holiday });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Delete a holiday
    async deleteHoliday(req, res, next) {
        try {
            const { id } = req.params;
            const holiday = await HolidayModel.deleteHoliday(id);
            res.status(200).json({ message: 'Holiday deleted successfully', data: holiday });
        } catch (error) {
            next(error);
        }
    },

    // Public: Check if a specific date is a holiday
    async checkDate(req, res, next) {
        try {
            const { date } = req.query;
            if (!date) {
                return res.status(400).json({ error: 'Date parameter is required' });
            }
            const isHoliday = await HolidayModel.isHoliday(date);
            res.status(200).json({ data: { date, isHoliday } });
        } catch (error) {
            next(error);
        }
    }
};

// Default Indian holidays - dates that are fixed every year
// Variable holidays (Holi, Dussehra, Diwali, Good Friday) need approximate dates
function getDefaultHolidays(year) {
    const holidays = [
        { name: 'Republic Day', date: `${year}-01-26`, year, type: 'public' },
        { name: 'Independence Day', date: `${year}-08-15`, year, type: 'public' },
        { name: 'Gandhi Jayanti', date: `${year}-10-02`, year, type: 'public' },
        { name: 'Christmas', date: `${year}-12-25`, year, type: 'public' },
    ];

    // Variable holidays - approximate dates (admin should adjust these)
    // These are rough estimates; the admin can update them via the UI
    const variableHolidays = {
        2025: [
            { name: 'Holi', date: `${year}-03-14` },
            { name: 'Good Friday', date: `${year}-04-18` },
            { name: 'Dussehra', date: `${year}-10-02` },
            { name: 'Diwali', date: `${year}-10-20` },
        ],
        2026: [
            { name: 'Holi', date: `${year}-03-04` },
            { name: 'Good Friday', date: `${year}-04-03` },
            { name: 'Dussehra', date: `${year}-10-21` },
            { name: 'Diwali', date: `${year}-11-08` },
        ],
        2027: [
            { name: 'Holi', date: `${year}-03-22` },
            { name: 'Good Friday', date: `${year}-03-26` },
            { name: 'Dussehra', date: `${year}-10-11` },
            { name: 'Diwali', date: `${year}-10-29` },
        ],
    };

    if (variableHolidays[year]) {
        variableHolidays[year].forEach(h => {
            holidays.push({ ...h, year, type: 'public' });
        });
    }

    return holidays;
}

module.exports = holidayController;
