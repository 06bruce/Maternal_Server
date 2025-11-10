# Backend Google Authentication Setup

## Overview

Google OAuth authentication has been successfully implemented on the backend. Users can now sign up and log in using their Google accounts, and their credentials will be stored in the MongoDB database.

## Changes Made

### 1. **User Model Updates** (`models/User.js`)

Added new fields to support Google authentication:

```javascript
googleId: {
  type: String,
  sparse: true,
  unique: true
},
authProvider: {
  type: String,
  enum: ['local', 'google'],
  default: 'local'
},
profilePicture: {
  type: String
}
```

**Key Changes:**
- Made `password` field optional for Google auth users
- Made `gender` field have a default value (`'prefer_not_to_say'`)
- Updated password hashing middleware to skip Google auth users
- Added `googleId` to uniquely identify Google users
- Added `authProvider` to track authentication method
- Added `profilePicture` to store Google profile image

### 2. **Authentication Routes** (`routes/auth.js`)

Added new endpoint: `POST /api/auth/google`

**Endpoint Details:**
- **Route:** `POST /api/auth/google`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "credential": "google_jwt_token_here"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Google authentication successful",
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "profilePicture": "url",
      "isPregnant": false,
      "authProvider": "google"
    }
  }
  ```

**What the Endpoint Does:**

1. **Verifies Google Token** - Uses Google OAuth2 library to validate the credential
2. **Extracts User Info** - Gets email, name, picture, and Google ID from the token
3. **Checks Email Verification** - Ensures the Google email is verified
4. **Finds or Creates User:**
   - If user exists with that email → Updates Google info and logs them in
   - If new user → Creates account with Google information
5. **Generates JWT Token** - Creates authentication token for the app
6. **Sends Welcome Email** - (For new users only)

### 3. **Package Installation**

Installed `google-auth-library`:
```bash
npm install google-auth-library
```

This package is used to verify Google tokens server-side.

## Environment Variables

### Required Variable

Add this to your `.env` file and Render dashboard:

```bash
GOOGLE_CLIENT_ID=238219573004-letenot24n7l309j006081lkv63nflnb.apps.googleusercontent.com
```

**Note:** This must be the SAME Client ID used in the frontend.

### Where to Add:

#### Local Development
Create or update your `.env` file:
```bash
# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Email (existing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=maternalhub1@gmail.com
EMAIL_PASSWORD=zqhk kyps vqly bocp
EMAIL_FROM_NAME=Maternal Health Platform

# Frontend URL
FRONTEND_URL=https://maternalhub.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=238219573004-letenot24n7l309j006081lkv63nflnb.apps.googleusercontent.com
```

#### Render Deployment
1. Go to: https://dashboard.render.com/
2. Select your service: `maternal-server`
3. Click: **Environment** tab
4. Add new variable:
   - **Key:** `GOOGLE_CLIENT_ID`
   - **Value:** `238219573004-letenot24n7l309j006081lkv63nflnb.apps.googleusercontent.com`
5. Click **Save Changes**
6. Wait 2-3 minutes for automatic redeployment

## Database Schema Changes

When a user signs up with Google, the following data is stored:

```javascript
{
  name: "John Doe",              // From Google
  email: "john@gmail.com",        // From Google
  googleId: "103847....",         // Unique Google ID
  authProvider: "google",         // Authentication method
  profilePicture: "https://...",  // Google profile picture URL
  gender: "prefer_not_to_say",    // Default value
  isPregnant: false,              // Default value
  lastLogin: Date,                // Current timestamp
  createdAt: Date,                // Auto-generated
  updatedAt: Date                 // Auto-generated
}
```

**Note:** Google auth users do NOT have a `password` field since they authenticate through Google.

## Authentication Flow

### New Google User Signup
1. User clicks "Sign in with Google" on frontend
2. Google OAuth popup opens
3. User selects Google account
4. Frontend receives Google credential token
5. Frontend sends token to `POST /api/auth/google`
6. Backend verifies token with Google
7. Backend creates new user in database
8. Backend sends welcome email
9. Backend returns JWT token and user info
10. Frontend stores token and redirects to dashboard

### Existing Google User Login
1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User selects Google account
4. Frontend sends token to `POST /api/auth/google`
5. Backend finds existing user by email or googleId
6. Backend updates last login timestamp
7. Backend returns JWT token and user info
8. Frontend stores token and redirects to dashboard

### Linking Existing Email/Password Account
If a user already has an account with email/password and then signs in with Google using the same email:
- The backend will find the existing account
- Add Google ID to the account
- Update auth provider to 'google'
- User can now use either method to sign in

## Security Features

1. **Token Verification** - All Google tokens are verified server-side
2. **Email Verification Check** - Only verified Google emails are accepted
3. **Unique Constraints** - Email and Google ID are unique in database
4. **JWT Authentication** - App uses its own JWT tokens after Google auth
5. **Error Handling** - Proper error messages for expired/invalid tokens

## API Error Responses

### Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid Google credentials"
}
```

### Email Not Verified
```json
{
  "success": false,
  "message": "Google email is not verified"
}
```

### Expired Token
```json
{
  "success": false,
  "message": "Google token has expired. Please try again."
}
```

### Database Unavailable
```json
{
  "success": false,
  "message": "Database service unavailable."
}
```

## Testing the Implementation

### Manual Testing

1. **Start Backend Server**
   ```bash
   npm start
   ```

2. **Test with Frontend**
   - Go to your frontend login page
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Check if you're redirected and logged in

3. **Verify Database**
   - Check MongoDB for the new user document
   - Verify fields: `googleId`, `authProvider`, `profilePicture`

### Using Postman/Thunder Client

You can't easily test Google OAuth with Postman because you need a valid Google credential token. However, you can:

1. **Get a token from frontend** (from browser DevTools Network tab)
2. **Make POST request:**
   ```
   POST http://localhost:5000/api/auth/google
   Content-Type: application/json

   {
     "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4M..."
   }
   ```

## Troubleshooting

### Error: "Invalid Google credentials"

**Possible Causes:**
- Google token is expired
- GOOGLE_CLIENT_ID doesn't match frontend
- Token is malformed

**Solution:**
- Verify GOOGLE_CLIENT_ID matches in both frontend and backend
- Try logging in again to get fresh token
- Check server logs for detailed error

### Error: "google-auth-library not found"

**Solution:**
```bash
cd /path/to/Maternal_Server
npm install google-auth-library
```

### User Created but No Welcome Email

**Cause:** Email service error (non-blocking)

**Solution:**
- Check email credentials in .env
- Review email service logs
- User is still created successfully

### Duplicate Key Error

**Cause:** Email or googleId already exists

**Solution:**
- This is expected behavior
- User should log in instead of signing up
- Frontend should handle this gracefully

## Database Migration

If you have existing users and want to add Google auth:

**No migration needed!** The new fields have defaults:
- `authProvider` defaults to `'local'`
- `googleId` is optional
- `profilePicture` is optional

Existing users can continue using email/password, and can link Google later.

## Production Deployment Checklist

- [ ] Install `google-auth-library` package
- [ ] Add `GOOGLE_CLIENT_ID` to environment variables
- [ ] Update User model with new fields
- [ ] Add Google auth route to `routes/auth.js`
- [ ] Test Google login on frontend
- [ ] Verify user creation in database
- [ ] Test both new and existing user flows
- [ ] Monitor error logs for issues

## Support Multiple Auth Providers

The system now supports:
- ✅ **Email/Password** (local)
- ✅ **Google OAuth** (google)
- 🔲 **Facebook** (future)
- 🔲 **Apple** (future)

To add more providers, follow the same pattern:
1. Add provider ID field to User model
2. Update `authProvider` enum
3. Create provider-specific route
4. Verify provider token
5. Create or update user

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [google-auth-library NPM](https://www.npmjs.com/package/google-auth-library)
- [MongoDB Sparse Indexes](https://docs.mongodb.com/manual/core/index-sparse/)

## Notes

- Google tokens expire after ~1 hour
- Users can have both password and Google auth on same account
- Profile pictures are URLs hosted by Google
- Google IDs are unique and never change for a user
- Email verification is enforced for security
