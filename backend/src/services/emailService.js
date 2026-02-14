const nodemailer = require('nodemailer');
const dns = require('dns');
const path = require('path');
const fs = require('fs');

// Force Node.js to resolve DNS using IPv4 first
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

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
            from: `"CBALMS" <${process.env.EMAIL_USER}>`,
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
            from: `"CBALMS" <${process.env.EMAIL_USER}>`,
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

module.exports = { sendLoginConfirmationEmail, sendLogoutConfirmationEmail };
