const nodemailer = require('nodemailer');

// Create reusable email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

/**
 * Email verification template
 */
const getVerificationEmailTemplate = (userName, verificationLink) => {
    return {
        subject: 'Verify Your Maternal Hub Account | Emeza Konti Yawe',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .divider { border-top: 2px solid #ddd; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤰 Maternal Hub</h1>
            <p>Your Trusted Pregnancy Companion</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}! / Muraho ${userName}!</h2>
            
            <p><strong>Welcome to Maternal Hub!</strong> We're excited to have you join our community of mothers and families.</p>
            
            <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>
            
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
            
            <div class="divider"></div>
            
            <p><strong>Kinyarwanda:</strong></p>
            <p>Murakaza neza kuri Maternal Hub! Kugira ngo urangize kwiyandikisha, kanda kuri button ikurikira kugirango wemeze imeli yawe.</p>
            
            <div class="divider"></div>
            
            <p><em>This verification link will expire in 24 hours.</em></p>
            
            <p>If you didn't create an account with Maternal Hub, please ignore this email.</p>
            
            <p>Best regards,<br>The Maternal Hub Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Maternal Hub Rwanda | Your health, our priority</p>
            <p>For support: support@maternalhub.rw | Emergency: Call 912</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
Hello ${userName}!

Welcome to Maternal Hub! To complete your registration, please verify your email address by visiting:

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The Maternal Hub Team
    `
    };
};

/**
 * Appointment confirmation email template
 */
const getAppointmentConfirmationTemplate = (userName, appointment) => {
    const appointmentDate = new Date(appointment.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `Appointment Confirmed - ${appointmentDate} at ${appointment.time}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-box { background: white; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>Your appointment has been successfully scheduled!</p>
            
            <div class="appointment-box">
              <div class="info-row">
                <span class="label">📅 Date:</span> ${appointmentDate}
              </div>
              <div class="info-row">
                <span class="label">🕐 Time:</span> ${appointment.time}
              </div>
              <div class="info-row">
                <span class="label">🏥 Location:</span> ${appointment.centerName}
              </div>
              <div class="info-row">
                <span class="label">📋 Reason:</span> ${appointment.reason}
              </div>
              ${appointment.notes ? `
              <div class="info-row">
                <span class="label">📝 Notes:</span> ${appointment.notes}
              </div>
              ` : ''}
            </div>
            
            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>Please arrive 15 minutes before your appointment time</li>
              <li>Bring your ID card and any relevant medical documents</li>
              <li>If pregnant, bring your pregnancy card (carnet)</li>
            </ul>
            
            <p>You will receive a reminder 24 hours before your appointment.</p>
            
            <p><strong>Need to reschedule?</strong> Please contact the health center or update via your Maternal Hub profile.</p>
            
            <p>Best regards,<br>Maternal Hub Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Maternal Hub Rwanda</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
Appointment Confirmed!

Hello ${userName},

Your appointment has been successfully scheduled:

Date: ${appointmentDate}
Time: ${appointment.time}
Location: ${appointment.centerName}
Reason: ${appointment.reason}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}

Important Reminders:
- Arrive 15 minutes early
- Bring ID and medical documents
- Bring your pregnancy card if applicable

You will receive a reminder 24 hours before your appointment.

Best regards,
Maternal Hub Team
    `
    };
};

/**
 * Appointment reminder email template
 */
const getAppointmentReminderTemplate = (userName, appointment) => {
    const appointmentDate = new Date(appointment.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `Reminder: Appointment Tomorrow at ${appointment.time}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Appointment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p><strong>This is a friendly reminder about your upcoming appointment tomorrow!</strong></p>
            
            <div class="reminder-box">
              <div style="margin: 10px 0;"><strong>📅 Date:</strong> Tomorrow, ${appointmentDate}</div>
              <div style="margin: 10px 0;"><strong>🕐 Time:</strong> ${appointment.time}</div>
              <div style="margin: 10px 0;"><strong>🏥 Location:</strong> ${appointment.centerName}</div>
            </div>
            
            <p><strong>Don't forget to bring:</strong></p>
            <ul>
              <li>ID card</li>
              <li>Pregnancy card (if applicable)</li>
              <li>Any medical documents</li>
            </ul>
            
            <p>If you need to cancel or reschedule, please do so as soon as possible.</p>
            
            <p>See you tomorrow!<br>Maternal Hub Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
Appointment Reminder

Hello ${userName},

Reminder: You have an appointment tomorrow!

Date: Tomorrow, ${appointmentDate}
Time: ${appointment.time}
Location: ${appointment.centerName}

Don't forget to bring:
- ID card
- Pregnancy card (if applicable)
- Medical documents

See you tomorrow!
Maternal Hub Team
    `
    };
};

/**
 * Emergency notification to hospitals
 */
const getHospitalEmergencyTemplate = (emergency) => {
    return {
        subject: `🚨 URGENT: Maternal Emergency Alert - ${emergency.emergencyId}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #f44336; border-radius: 0 0 10px 10px; }
          .emergency-box { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
          .urgent { color: #f44336; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 MATERNAL EMERGENCY ALERT</h1>
            <p class="urgent">IMMEDIATE RESPONSE REQUIRED</p>
          </div>
          <div class="content">
            <div class="emergency-box">
              <p><strong>Emergency ID:</strong> ${emergency.emergencyId}</p>
              <p><strong>Patient Name:</strong> ${emergency.userData.name}</p>
              <p><strong>Phone:</strong> ${emergency.userData.phone}</p>
              <p><strong>Age:</strong> ${emergency.userData.age || 'N/A'}</p>
              <p><strong>Email:</strong> ${emergency.userData.email || 'N/A'}</p>
              ${emergency.location ? `
              <p><strong>Location:</strong> Lat ${emergency.location.lat}, Lng ${emergency.location.lng}</p>
              ` : ''}
              <p><strong>Time:</strong> ${new Date(emergency.createdAt).toLocaleString()}</p>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Contact patient immediately at ${emergency.userData.phone}</li>
              <li>Prepare emergency maternal care facilities</li>
              <li>Dispatch ambulance if necessary</li>
              <li>Confirm response via Maternal Hub system</li>
            </ul>
            
            <p class="urgent">This is an automated emergency alert from Maternal Hub Rwanda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
🚨 MATERNAL EMERGENCY ALERT - IMMEDIATE RESPONSE REQUIRED

Emergency ID: ${emergency.emergencyId}
Patient: ${emergency.userData.name}
Phone: ${emergency.userData.phone}
Age: ${emergency.userData.age || 'N/A'}
Time: ${new Date(emergency.createdAt).toLocaleString()}

ACTION REQUIRED:
- Contact patient immediately
- Prepare emergency facilities
- Dispatch ambulance if needed
- Confirm response via system

Maternal Hub Rwanda - Automated Emergency Alert
    `
    };
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (email, userName, verificationToken) => {
    try {
        const transporter = createTransporter();
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const template = getVerificationEmailTemplate(userName, verificationLink);

        await transporter.sendMail({
            from: `"Maternal Hub" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        console.log(`✅ Verification email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmation = async (email, userName, appointment) => {
    try {
        const transporter = createTransporter();
        const template = getAppointmentConfirmationTemplate(userName, appointment);

        await transporter.sendMail({
            from: `"Maternal Hub Appointments" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        console.log(`✅ Appointment confirmation sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending appointment confirmation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment reminder email
 */
const sendAppointmentReminder = async (email, userName, appointment) => {
    try {
        const transporter = createTransporter();
        const template = getAppointmentReminderTemplate(userName, appointment);

        await transporter.sendMail({
            from: `"Maternal Hub Reminders" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        console.log(`✅ Appointment reminder sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending appointment reminder:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send emergency alert to hospital
 */
const sendHospitalEmergencyAlert = async (hospitalEmail, emergency) => {
    try {
        const transporter = createTransporter();
        const template = getHospitalEmergencyTemplate(emergency);

        await transporter.sendMail({
            from: `"Maternal Hub Emergency System" <${process.env.EMAIL_USER}>`,
            to: hospitalEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
            priority: 'high',
        });

        console.log(`🚨 Emergency alert sent to ${hospitalEmail}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending emergency alert:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendHospitalEmergencyAlert,
};
