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
      const { newPassword, accessToken, refreshToken, recoveryToken, email } = req.body;

      let userId;

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError || !sessionData?.user) {
          return res.status(400).json({ error: sessionError?.message || 'Invalid or expired reset session' });
        }

        userId = sessionData.user.id;
      } else if (recoveryToken && email) {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          email,
          token: recoveryToken,
          type: 'recovery'
        });

        if (otpError || !otpData?.user) {
          return res.status(400).json({ error: otpError?.message || 'Invalid or expired recovery token' });
        }

        userId = otpData.user.id;
      } else {
        return res.status(400).json({
          error: 'A valid recovery token/session is required to reset password'
        });
      }

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
