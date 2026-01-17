const AuthModel = require('../models/authModel');
const ProfileModel = require('../models/profileModel');

const normalizeUser = (user, profile) => {
    if (!user) return null;
    const profileData = profile || {};
    return {
        ...user,
        name: profileData.full_name || user.user_metadata?.name || '',
        department: profileData.department || '',
        mobileNumber: profileData.mobile_number || '',
        employeeId: profileData.employee_id || '',
        role: profileData.role || 'employee',
        profile: profileData // Keep original profile just in case
    };
};

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
                    // normalize user for response
                    const normalizedUser = normalizeUser(user, profileData);

                    return res.status(201).json({
                        message: 'User registered successfully',
                        user: normalizedUser,
                        session: authData.session
                    });
                } catch (profileError) {
                    console.error('Profile creation error:', profileError);
                    // If profile creation fails, we might still want to return success but warn?
                    // Or maybe fail? For now, let's return with partial data
                    return res.status(201).json({
                        message: 'User registered but profile creation failed',
                        user: normalizeUser(user, {}),
                        session: authData.session
                    });
                }
            }
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

            const normalizedUser = normalizeUser(data.user, profile);

            res.status(200).json({
                message: 'Login successful',
                session: data.session,
                user: normalizedUser
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

            const normalizedUser = normalizeUser(user, profile);

            res.status(200).json({
                user: normalizedUser
            });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching user details' });
        }
    },

    async updateProfile(req, res) {
        try {
            const user = req.user;
            const { name, mobileNumber } = req.body;

            // Prepare updates. Only allow specific fields.
            // Database is flat: full_name, mobile_number
            const updates = {};
            if (name !== undefined) updates.full_name = name;
            if (mobileNumber !== undefined) updates.mobile_number = mobileNumber;

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            let updatedProfile;
            try {
                updatedProfile = await ProfileModel.updateProfile(user.id, updates);
            } catch (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Failed to update profile in database' });
            }

            // Return updated user object
            const normalizedUser = normalizeUser(user, updatedProfile);

            res.status(200).json({
                message: 'Profile updated successfully',
                user: normalizedUser
            });

        } catch (error) {
            console.error('Update Profile Controller Error:', error);
            res.status(500).json({ error: 'Server error during profile update' });
        }
    }
};

module.exports = authController;
