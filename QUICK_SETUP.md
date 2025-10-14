# Quick Setup Guide - Email & Password Reset

## 1. Install Dependencies
```bash
npm install
```
*(nodemailer is already added to package.json)*

## 2. Configure Email in .env

Add these to your `.env` file:

### For Gmail (Quick Start):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM_NAME=Maternal Health Platform
FRONTEND_URL=https://maternalhub.vercel.app
```

**Get Gmail App Password:**
1. Enable 2FA on Google Account
2. Go to: Google Account → Security → App passwords
3. Generate password for "Mail"
4. Copy the 16-character password

## 3. Test the Setup

### Start Server:
```bash
npm start
```

### Test Registration (with email):
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "gender": "female"
  }'
```
*Check email inbox for welcome message*

### Test Forgot Password:
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
*Check email for reset link*

### Test Reset Password:
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "password": "newpassword123"
  }'
```

## 4. New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register user (now sends welcome email) |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |

## 5. Frontend Integration

### Forgot Password Page:
```javascript
// Send reset request
fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail })
});
```

### Reset Password Page:
```javascript
// Get token from URL: /reset-password?token=...
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Reset password
fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, password: newPassword })
});
```

## 6. What's Included

✅ Welcome email on registration  
✅ Password reset via email  
✅ Secure token system (1-hour expiry)  
✅ Beautiful HTML email templates  
✅ Password reset confirmation emails  
✅ Security best practices  

## Troubleshooting

**Emails not sending?**
- Check `.env` has correct email credentials
- For Gmail: Use App Password, not regular password
- Check spam/junk folder
- Look at server console for error messages

**"Email service not configured"?**
- Verify all EMAIL_* variables are set in `.env`
- Restart the server after changing `.env`

## Need More Help?

See `EMAIL_PASSWORD_RESET_SETUP.md` for detailed documentation.
