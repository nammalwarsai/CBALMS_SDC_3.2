const AuthModel = require('../models/authModel');
const ProfileModel = require('../models/profileModel');

const authController = {
    async signup(req, res) {
        try {
            const { email, password, fullName, role, department, mobileNumber, employeeId } = req.body;

            // 1. Create Auth User
            const { data: authData, error: authError } = await AuthModel.signUp(email, password);

            if (authError) {
                return res.status(400).json({ error: authError.message });
            }

            const user = authData.user;

            if (user) {
                // 2. Create Profile
                const profileData = {
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    role: role || 'employee',
                    department,
                    mobile_number: mobileNumber,
                    employee_id: employeeId
                };

                try {
                    await ProfileModel.createProfile(profileData);
                } catch (profileError) {
                    console.error('Profile creation error:', profileError);
                    // Continue even if profile creation acts up (e.g. trigger race condition)
                    // But ideally we should handle this gracefully
                }
            }

            return res.status(201).json({
                message: 'User registered successfully',
                user,
                session: authData.session
            });

        } catch (error) {
            console.error('Signup Controller Error:', error);
            res.status(500).json({ error: 'Server error during signup' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { data, error } = await AuthModel.signIn(email, password);

            if (error) {
                return res.status(401).json({ error: error.message });
            }

            // Fetch profile details
            let profile = null;
            if (data.user) {
                try {
                    profile = await ProfileModel.getProfileById(data.user.id);
                } catch (err) {
                    console.error('Error fetching profile', err);
                }
            }

            res.status(200).json({
                message: 'Login successful',
                session: data.session,
                user: { ...data.user, profile }
            });

        } catch (error) {
            console.error('Login Controller Error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    },

    async getMe(req, res) {
        try {
            const user = req.user;
            let profile = null;
            try {
                profile = await ProfileModel.getProfileById(user.id);
            } catch (err) {
                // profile might not exist or error
            }

            res.status(200).json({
                user: { ...user, profile }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching user details' });
        }
    }
};

module.exports = authController;
