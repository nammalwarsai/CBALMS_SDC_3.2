const supabase = require('../config/supabaseClient');

const passwordController = {
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        message: 'If an account exists for this email, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { newPassword, accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({
          error: 'A valid access token is required to reset password'
        });
      }

      // Verify the access token and get user info using admin-level getUser
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

      if (userError || !userData?.user) {
        return res.status(400).json({ 
          error: 'Invalid or expired reset link. Please request a new password reset link.' 
        });
      }

      const userId = userData.user.id;

      // Update password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = passwordController;
