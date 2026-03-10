# Supabase Authentication Integration Guide

## Overview

This document explains the complete Supabase authentication integration for the Properavista app, including:
- User Registration (Sign Up)
- User Login
- Password Reset with PIN code
- Session Management
- Database Schema

## Project Credentials

```
Project URL: https://ceuhqekexyfikrxebvzd.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldWhxZWtleHlmaWtyeGVidnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODg5MjIsImV4cCI6MjA4NzM2NDkyMn0.rELREQ6FhtGODGv2WN4xGc9UuXnIVjhOX9Bg5QtnkR4
Service Role Key: (See .env.local)
```

## Files Created/Modified

### New Files

1. **`.env.local`** - Environment variables with Supabase credentials
2. **`lib/supabase.ts`** - Supabase client initialization
3. **`backend/db/schema.sql`** - Database schema with tables and RLS policies
4. **`utils/password-reset.ts`** - Password reset utilities (PIN generation, SMS/Email sending)
5. **`backend/trpc/routes/auth/password-reset/route.ts`** - Request password reset endpoint
6. **`backend/trpc/routes/auth/verify-pin/route.ts`** - Verify PIN endpoint
7. **`backend/trpc/routes/auth/confirm-reset/route.ts`** - Confirm password reset endpoint

### Modified Files

1. **`backend/trpc/routes/auth/login/route.ts`** - Now uses Supabase authentication
2. **`backend/trpc/routes/auth/signup/route.ts`** - Now creates users in Supabase
3. **`backend/trpc/routes/auth/me/route.ts`** - Fetches current user from Supabase
4. **`backend/trpc/app-router.ts`** - Added new auth routes
5. **`hooks/useAuthStore.ts`** - Updated with real API calls and password reset flow
6. **`package.json`** - Added `@supabase/supabase-js` dependency

## Database Schema

### Tables Created

#### 1. **user_profiles**
Extends Supabase Auth with additional profile information:
- `id` (UUID) - User ID from auth.users
- `email` (varchar) - User email
- `name` (varchar) - User's full name
- `phone` (varchar) - Phone number
- `whatsapp` (varchar) - WhatsApp number
- `avatar_url` (text) - Profile picture URL
- `company_name` (varchar) - Company/business name
- `description` (text) - Bio/description
- `address` (text) - Address
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last update time

#### 2. **password_reset_tokens**
Stores PIN codes for password reset:
- `id` (UUID) - Token ID
- `user_id` (UUID) - User ID
- `pin_code` (varchar) - 6-digit PIN
- `phone_number` (varchar) - Recipient phone number
- `is_used` (boolean) - Has PIN been used?
- `expires_at` (timestamp) - PIN expiration time (15 minutes)
- `created_at` (timestamp) - PIN creation time

### Security (Row Level Security)

- Users can only view/update their own profile
- Users can only access their own reset tokens
- Public can read user profiles (for property listings)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Run Database Schema
Go to Supabase Dashboard:
1. Open SQL Editor
2. Create new query
3. Copy contents of `backend/db/schema.sql`
4. Execute the query

This creates:
- Tables: `user_profiles`, `password_reset_tokens`
- RLS policies for security
- Indexes for performance
- Triggers for timestamps

### 3. Configure Email/SMS (Optional)

Currently, PIN sending is mocked. To use real services:

**For Email:**
- Update `utils/password-reset.ts` → `sendPinToEmail()` function
- Integrate with SendGrid, AWS SES, or similar

**For SMS:**
- Update `utils/password-reset.ts` → `sendPinToSms()` function
- Integrate with Twilio, Africa's Talking, or similar

Example for Twilio SMS:
```typescript
export async function sendPinToSms(phoneNumber: string, pin: string): Promise<boolean> {
  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    body: `Your Properavista password reset code is: ${pin}. It expires in 15 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
  return !!message.sid;
}
```

## Authentication Flow

### Sign Up Flow
```
User Input (name, email, password, phone, whatsapp)
         ↓
POST /trpc/auth.signup
         ↓
Supabase creates auth user
         ↓
Create user_profiles record
         ↓
Auto-login user
         ↓
Return user + session tokens
         ↓
Store in useAuthStore + AsyncStorage
```

### Login Flow
```
User Input (email, password)
         ↓
POST /trpc/auth.login
         ↓
Supabase validates credentials
         ↓
Fetch user_profiles data
         ↓
Return user + session tokens
         ↓
Store in useAuthStore + AsyncStorage
```

### Password Reset Flow (3 Steps)

#### Step 1: Request Reset
```
User Input (email, phone)
         ↓
POST /trpc/auth.passwordReset
         ↓
Validate email exists + phone matches
         ↓
Generate 6-digit PIN
         ↓
Store in password_reset_tokens (expires 15 min)
         ↓
Send PIN to SMS + Email (currently mocked)
         ↓
Return success & move to "verify" step
```

#### Step 2: Verify PIN
```
User Input (email, PIN from phone)
         ↓
POST /trpc/auth.verifyPin
         ↓
Check if PIN valid + not expired
         ↓
Return reset token
         ↓
Move to "complete" step
```

#### Step 3: Confirm Reset
```
User Input (email, PIN, new password)
         ↓
POST /trpc/auth.confirmReset
         ↓
Verify PIN again
         ↓
Update password in Supabase Auth
         ↓
Mark PIN as used
         ↓
Clear password reset flow
```

## API Endpoints

### Authentication

#### Login
```typescript
POST /trpc/auth.login
Input: { email: string, password: string }
Output: { 
  success: boolean
  user: User
  session: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    expiresAt: number
  }
}
```

#### Sign Up
```typescript
POST /trpc/auth.signup
Input: {
  name: string
  email: string
  password: string
  phone?: string
  whatsapp?: string
}
Output: Same as login
```

#### Get Current User
```typescript
GET /trpc/auth.me
Headers: { Authorization: "Bearer <access_token>" }
Output: { user: User | null }
```

#### Request Password Reset
```typescript
POST /trpc/auth.passwordReset
Input: {
  email: string
  phoneNumber: string
}
Output: {
  success: boolean
  message: string
  channel: "sms" | "email"
}
```

#### Verify Reset PIN
```typescript
POST /trpc/auth.verifyPin
Input: {
  email: string
  pinCode: string
}
Output: {
  success: boolean
  message: string
  resetToken: string
}
```

#### Confirm Password Reset
```typescript
POST /trpc/auth.confirmReset
Input: {
  email: string
  pinCode: string
  newPassword: string
}
Output: {
  success: boolean
  message: string
}
```

## Testing

### Test User Registration
```typescript
// From frontend
const { signup } = useAuthStore();
const success = await signup(
  'John Doe',
  'john@example.com',
  'Password123!',
  '08012345678',
  '08087654321'
);
```

### Test Login
```typescript
const { login } = useAuthStore();
const success = await login('john@example.com', 'Password123!');
```

### Test Password Reset
```typescript
const { requestPasswordReset, verifyResetPin, confirmPasswordReset } = useAuthStore();

// Step 1: Request
await requestPasswordReset('john@example.com', '08012345678');

// Step 2: User receives PIN (currently logged in console)
// Step 3: Verify PIN
await verifyResetPin('john@example.com', '123456'); // 6-digit PIN from SMS

// Step 4: Confirm with new password
await confirmPasswordReset('john@example.com', '123456', 'NewPassword123!');
```

## Troubleshooting

### "User not found" error
- Ensure user was created via sign up first
- Check that email is correct

### PIN not received
- Currently mocked in `utils/password-reset.ts`
- Check browser console for PIN code
- Implement real SMS/Email service

### "Invalid or expired PIN"
- PIN expires after 15 minutes
- PIN can only be used once
- Request a new PIN if needed

### "Session expired"
- Access tokens expire after set time
- Use refresh token to get new access token
- User will need to login again

## Security Notes

1. **Never expose Service Role Key** in client code (only in backend)
2. **Anon Key** is safe for client code
3. **Passwords never logged** - all validation happens server-side
4. **PINs stored hashed** in production (implement hash function)
5. **RLS Policies** prevent users from accessing others' data
6. **HTTPS only** in production

## Next Steps

1. Test registration and login with mobile app
2. Configure real SMS service (Twilio, Africa's Talking)
3. Configure real email service (SendGrid, AWS SES)
4. Add password strength validation
5. Add email verification (optional)
6. Add 2FA (optional)
7. Add OAuth (Google, Apple) (optional)

## Support

For Supabase documentation: https://supabase.com/docs
For tRPC documentation: https://trpc.io/docs
