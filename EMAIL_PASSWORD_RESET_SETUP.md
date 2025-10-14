# Email and Password Reset Setup Guide

## Overview
This guide explains how to configure and use the email notification and password reset features that have been added to the Maternal Health Platform.

## Features Implemented

### 1. Welcome Email on Registration
- Automatically sends a welcome email when a new user registers
- Includes platform information and helpful resources
- Beautiful HTML email template with branding

### 2. Password Reset Functionality
- Users can request password reset via email
- Secure token-based reset system (tokens expire after 1 hour)
- Email notifications for reset requests and confirmations

## API Endpoints

### Registration (with Email)
**Endpoint:** `POST /api/auth/register`

The existing registration endpoint now automatically sends a welcome email to newly registered users.

### Forgot Password
**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email."
}
```

**Note:** For security reasons, the response is the same whether the user exists or not.

### Reset Password
**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "new_password_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully.",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Email Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM_NAME=Maternal Health Platform

# Frontend URL (for reset links)
FRONTEND_URL=https://maternalhub.vercel.app
```

### Setting Up Email Service

#### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Update .env:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```

#### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account** at https://sendgrid.com
2. **Create API Key:**
   - Go to Settings → API Keys → Create API Key
   - Give it "Mail Send" permissions
3. **Update .env:**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your_sendgrid_api_key
   ```

#### Option 3: Outlook/Hotmail

1. **Update .env:**
   ```env
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your.email@outlook.com
   EMAIL_PASSWORD=your_password
   ```

#### Option 4: Custom SMTP Server

Configure your own SMTP server details:
```env
EMAIL_HOST=your.smtp.server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_username
EMAIL_PASSWORD=your_password
```

## Frontend Integration

### Forgot Password Flow

1. **Create Forgot Password Page** (`/forgot-password`):
```javascript
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch('http://your-api/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Password reset link has been sent to your email!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

2. **Create Reset Password Page** (`/reset-password?token=...`):
```javascript
const handleResetPassword = async (token, newPassword) => {
  try {
    const response = await fetch('http://your-api/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Save the JWT token
      localStorage.setItem('token', data.token);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Security Features

1. **Token Expiration:** Reset tokens expire after 1 hour
2. **Token Hashing:** Tokens are hashed before storage in database
3. **One-Time Use:** Tokens are deleted after successful password reset
4. **Secure Response:** API doesn't reveal if email exists (forgot password endpoint)
5. **Password Hashing:** Passwords are hashed with bcrypt (cost factor 12)

## Email Templates

The email service includes three types of emails:

1. **Welcome Email:** Sent on user registration
2. **Password Reset Email:** Sent when password reset is requested
3. **Password Reset Confirmation:** Sent after successful password reset

All emails include:
- Professional HTML templates
- Plain text fallbacks
- Branding and styling
- Clear call-to-action buttons

## Testing

### Test Email Service
```javascript
// In your development environment, test the email service:
const { sendWelcomeEmail } = require('./utils/emailService');

sendWelcomeEmail({
  to: 'test@example.com',
  name: 'Test User'
}).then(result => console.log(result));
```

### Test Password Reset Flow

1. **Request Password Reset:**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

2. **Check your email** for the reset token
3. **Reset Password:**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "token_from_email", "password": "newpassword123"}'
```

## Troubleshooting

### Emails Not Sending

1. **Check environment variables** are correctly set in `.env`
2. **Verify SMTP credentials** are correct
3. **Check server logs** for error messages
4. **Test email service configuration:**
   ```javascript
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransporter({
     host: process.env.EMAIL_HOST,
     port: process.env.EMAIL_PORT,
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASSWORD
     }
   });
   
   transporter.verify((error, success) => {
     if (error) console.log('Error:', error);
     else console.log('Server is ready to send emails');
   });
   ```

### Gmail Specific Issues

- Ensure 2FA is enabled
- Use App Password, not regular password
- Check "Less secure app access" if using regular password (not recommended)

### Reset Token Issues

- **Token expired:** Users have 1 hour to use the reset link
- **Invalid token:** Token may have been already used or doesn't exist
- **Token not found:** Check database connectivity

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun)
2. **Set up SPF, DKIM, and DMARC** records for your domain
3. **Monitor email delivery rates** and bounces
4. **Implement rate limiting** on password reset endpoints
5. **Add CAPTCHA** to prevent automated attacks
6. **Log email sending attempts** for audit trails
7. **Consider email templates customization** based on user preferences

## Files Modified/Created

### New Files:
- `/utils/emailService.js` - Email sending functionality

### Modified Files:
- `/models/User.js` - Added reset token fields and methods
- `/routes/auth.js` - Added password reset endpoints and email integration
- `/.env.example` - Added email configuration variables
- `/package.json` - Added nodemailer dependency

## Support

If you encounter any issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test your SMTP connection independently
4. Review the email service provider's documentation
5. Check spam/junk folders for test emails

## Next Steps

Consider implementing:
- Email verification on registration
- Two-factor authentication (2FA)
- Email change functionality
- Account recovery via security questions
- Admin email notifications
- Batch email functionality for announcements
