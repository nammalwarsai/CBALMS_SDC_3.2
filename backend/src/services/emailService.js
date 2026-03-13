const nodemailer = require('nodemailer');
const dns = require('dns');
const path = require('path');
const fs = require('fs');

// Force Node.js to resolve DNS using IPv4 first
dns.setDefaultResultOrder('ipv4first');

const emailUser = (process.env.EMAIL_USER || '').trim();
// Gmail app passwords are often copied with spaces; normalize to 16-char token.
const emailAppPassword = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

const isEmailConfigured = Boolean(emailUser && emailAppPassword);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    // Prefer IPv4 on platforms where IPv6 egress is unavailable.
    family: 4,
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
        user: emailUser,
        pass: emailAppPassword,
    },
    tls: {
        servername: 'smtp.gmail.com',
        minVersion: 'TLSv1.2'
    }
});

const verifyEmailConfig = async () => {
    if (!isEmailConfigured) {
        console.warn('Email service disabled: EMAIL_USER or EMAIL_APP_PASSWORD is missing.');
        return false;
    }

    try {
        await transporter.verify();
        console.log(`Email service ready for sender: ${emailUser}`);
        return true;
    } catch (error) {
        console.error('Email service verification failed:', error.message);
        return false;
    }
};

const ensureEmailReady = () => {
    if (!isEmailConfigured) {
        console.warn('Skipping email send: email credentials are not configured.');
        return false;
    }
    return true;
};

const loadTemplate = (templateName, replacements) => {
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    let html = fs.readFileSync(templatePath, 'utf-8');
    for (const [key, value] of Object.entries(replacements)) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
};

const sendLoginConfirmationEmail = async (email, userName) => {
    try {
        if (!ensureEmailReady()) return;

        const now = new Date();
        const loginDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const loginTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });

        const html = loadTemplate('loginConfirmation.html', {
            userName: userName || 'User',
            loginDate,
            loginTime,
            year: String(now.getFullYear()),
        });

        const mailOptions = {
            from: `"CBALMS" <${emailUser}>`,
            to: email,
            subject: 'Login Notification - CBALMS',
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Login confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send login confirmation email:', error.message);
    }
};

const sendLogoutConfirmationEmail = async (email, userName) => {
    try {
        if (!ensureEmailReady()) return;

        const now = new Date();
        const logoutDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const logoutTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });

        const html = loadTemplate('logoutConfirmation.html', {
            userName: userName || 'User',
            logoutDate,
            logoutTime,
            year: String(now.getFullYear()),
        });

        const mailOptions = {
            from: `"CBALMS" <${emailUser}>`,
            to: email,
            subject: 'Logout Notification - CBALMS',
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Logout confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send logout confirmation email:', error.message);
    }
};

const sendLeaveApplicationEmail = async (email, userName, leaveDetails) => {
    try {
        if (!ensureEmailReady()) return;

        const { leaveType, startDate, endDate, workingDays, reason } = leaveDetails;
        const now = new Date();

        const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        const html = loadTemplate('leaveApplication.html', {
            userName: userName || 'User',
            leaveType: leaveType || 'N/A',
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            workingDays: String(workingDays || 0),
            reason: reason || 'Not specified',
            year: String(now.getFullYear()),
        });

        const mailOptions = {
            from: `"CBALMS" <${emailUser}>`,
            to: email,
            subject: 'Leave Application Submitted - CBALMS',
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Leave application email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send leave application email:', error.message);
    }
};

const sendLeaveStatusEmail = async (email, userName, leaveDetails) => {
    try {
        if (!ensureEmailReady()) return;

        const { leaveType, startDate, endDate, status, adminName, remarks } = leaveDetails;
        const now = new Date();
        const isApproved = status === 'Approved';

        const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        // Build remarks section HTML
        const remarksSection = remarks
            ? `<tr>
                <td style="padding-top:16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td width="40" valign="top">
                                <div style="width:36px;height:36px;background-color:#f3e5f5;border-radius:8px;text-align:center;line-height:36px;">
                                    <span style="font-size:16px;">&#128172;</span>
                                </div>
                            </td>
                            <td style="padding-left:12px;" valign="middle">
                                <p style="margin:0;color:#8a8da0;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Admin Remarks</p>
                                <p style="margin:3px 0 0 0;color:#1a1a2e;font-size:15px;font-weight:600;">${remarks}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>`
            : '';

        const html = loadTemplate('leaveStatus.html', {
            userName: userName || 'User',
            leaveType: leaveType || 'N/A',
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            status: status,
            statusLower: status.toLowerCase(),
            adminName: adminName || 'Admin',
            remarksSection: remarksSection,
            headerStyleAttr: `style="background:linear-gradient(135deg,${isApproved ? '#2e7d32' : '#c62828'} 0%,${isApproved ? '#1b5e20' : '#b71c1c'} 100%);padding:40px 40px 30px 40px;text-align:center;"`,
            badgeStyleAttr: `style="background-color:${isApproved ? '#e8f5e9' : '#ff0055'};border-radius:24px;padding:8px 20px;"`,
            badgeTextStyleAttr: `style="color:${isApproved ? '#2e7d32' : '#c62828'};font-size:14px;font-weight:600;"`,
            noticeTableStyleAttr: `style="background-color:${isApproved ? '#e8f5e9' : '#fce4ec'};border-radius:12px;border:1px solid ${isApproved ? '#a5d6a7' : '#ef9a9a'};"`,
            noticeTitleStyleAttr: `style="margin:0;color:${isApproved ? '#2e7d32' : '#c62828'};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;"`,
            // Approved styling
            headerColorStart: isApproved ? '#2e7d32' : '#c62828',
            headerColorEnd: isApproved ? '#1b5e20' : '#b71c1c',
            headerIcon: isApproved ? '&#9989;' : '&#10060;',
            badgeBgColor: isApproved ? '#e8f5e9' : '#ff0055',
            badgeTextColor: isApproved ? '#2e7d32' : '#c62828',
            badgeIcon: isApproved ? '&#10003;' : '&#10007;',
            noticeBgColor: isApproved ? '#e8f5e9' : '#ff0055',
            noticeBorderColor: isApproved ? '#a5d6a7' : '#ff0202',
            noticeIcon: isApproved ? '&#9989;' : '&#9888;&#65039;',
            noticeTextColor: isApproved ? '#2e7d32' : '#c62828',
            noticeTitle: isApproved ? 'Leave Approved' : 'Leave Rejected',
            noticeMessage: isApproved
                ? 'Your leave has been approved. Your leave balance has been updated accordingly. Enjoy your time off!'
                : 'Unfortunately, your leave request has been rejected. Please contact your administrator if you have any questions.',
            year: String(now.getFullYear()),
        });

        const mailOptions = {
            from: `"CBALMS" <${emailUser}>`,
            to: email,
            subject: `Leave ${status} - CBALMS`,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Leave status (${status}) email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send leave status email:', error.message);
    }
};

module.exports = { sendLoginConfirmationEmail, sendLogoutConfirmationEmail, sendLeaveApplicationEmail, sendLeaveStatusEmail, verifyEmailConfig };
