const AuthModel = require('../models/authModel');
const ProfileModel = require('../models/profileModel');
const LeaveBalanceModel = require('../models/leaveBalanceModel');

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
        profilePhotoUrl: profileData.profile_photo || '',
        profile: profileData
    };
};

const authController = {
    async signup(req, res, next) {
        try {
            const { email, password, fullName, role, department, mobileNumber, employeeId, profilePhoto } = req.body;

            // SECURITY: Force role to 'employee' - admin accounts must be created by existing admins
            const safeRole = 'employee';

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
                    role: safeRole,
                    department: department || '',
                    mobile_number: mobileNumber,
                    employee_id: employeeId,
                    profile_photo: profilePhoto || null
                };

                try {
                    await ProfileModel.createProfile(profileData);

                    // 3. Initialize leave balances for the new employee
                    try {
                        await LeaveBalanceModel.initializeBalances(user.id);
                    } catch (balanceError) {
                        console.error('Leave balance initialization error:', balanceError);
                    }

                    const normalizedUser = normalizeUser(user, profileData);

                    return res.status(201).json({
                        message: 'User registered successfully',
                        user: normalizedUser,
                        session: authData.session
                    });
                } catch (profileError) {
                    console.error('Profile creation error:', profileError);
                    return res.status(201).json({
                        message: 'User registered but profile creation failed',
                        user: normalizeUser(user, {}),
                        session: authData.session
                    });
                }
            }
        } catch (error) {
            next(error);
        }
    },

    async login(req, res, next) {
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
            next(error);
        }
    },

    async getMe(req, res, next) {
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
            next(error);
        }
    },

    async updateProfile(req, res, next) {
        try {
            const user = req.user;
            const { name, mobileNumber, profilePhoto } = req.body;

            const updates = {};
            if (name !== undefined) updates.full_name = name;
            if (mobileNumber !== undefined) updates.mobile_number = mobileNumber;
            if (profilePhoto !== undefined) updates.profile_photo = profilePhoto;

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

            const normalizedUser = normalizeUser(user, updatedProfile);

            res.status(200).json({
                message: 'Profile updated successfully',
                user: normalizedUser
            });

        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
