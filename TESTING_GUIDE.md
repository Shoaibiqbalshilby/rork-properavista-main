# Quick Start Guide - Testing Supabase Auth

## Prerequisites
- Node.js or Bun installed
- Supabase project set up (credentials in `.env.local`)
- Database schema executed (run SQL from `backend/db/schema.sql`)

## Step 1: Install Dependencies
```bash
npm install
# or
bun install
```

## Step 2: Verify Environment Variables
Check `.env.local` exists with:
```
EXPO_PUBLIC_SUPABASE_URL=https://ceuhqekexyfikrxebvzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from `backend/db/schema.sql`
4. Execute query
5. Check that tables `user_profiles` and `password_reset_tokens` are created

## Step 4: Start Development Server
```bash
npm start
# or
bun start
```

## Step 5: Test Sign Up

### Using Frontend UI
1. Open app
2. Navigate to Sign Up screen
3. Fill in:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "Password123"
   - Phone: "08012345678"
   - WhatsApp: "08087654321"
4. Click Sign Up
5. You should be logged in automatically

### Expected Results
- ✅ User created in Supabase Auth
- ✅ User profile created in `user_profiles` table
- ✅ User logged in with session tokens
- ✅ Session stored in AsyncStorage

## Step 6: Test Login

### Using Frontend UI
1. Open app
2. Navigate to Login screen
3. Fill in:
   - Email: "john@example.com"
   - Password: "Password123"
4. Click Login
5. You should be logged in

### Expected Results
- ✅ User authenticated
- ✅ Session tokens retrieved
- ✅ User profile fetched
- ✅ Redirected to home/dashboard

## Step 7: Test Password Reset

### Step 1: Request Reset
1. From Login screen, click "Forgot Password?"
2. Enter:
   - Email: "john@example.com"
   - Phone: "08012345678"
3. Click "Send Reset PIN"
4. Check browser console for PIN (e.g., "Sending PIN 123456...")

### Step 2: Verify PIN
1. Enter the 6-digit PIN from console
2. Click "Verify PIN"
3. You should move to password reset step

### Step 3: Reset Password
1. Enter new password: "NewPassword123"
2. Click "Reset Password"
3. You should see success message

### Step 4: Test New Password
1. Go back to Login
2. Try logging in with old password → should fail
3. Try logging in with new password → should succeed

## Testing Checklist

### Sign Up
- [ ] User created in Supabase Auth
- [ ] User profile created with all fields
- [ ] User automatically logged in
- [ ] Session tokens stored

### Login
- [ ] User can login with email/password
- [ ] Correct user data returned
- [ ] Session tokens obtained
- [ ] Error shown for invalid credentials

### Password Reset
- [ ] PIN generated (check console)
- [ ] PIN verification works
- [ ] New password accepted
- [ ] Old password no longer works
- [ ] PIN expires after 15 minutes

### Security
- [ ] User can only see own profile (RLS)
- [ ] User profiles publicly readable (for listings)
- [ ] Session tokens not stored in logs
- [ ] Invalid tokens rejected

## Debugging

### Check Supabase Database
```sql
-- View all users
SELECT * FROM auth.users;

-- View all profiles
SELECT * FROM public.user_profiles;

-- View reset tokens
SELECT * FROM public.password_reset_tokens;
```

### Check Browser Console
```javascript
// In browser console, check stored tokens
await AsyncStorage.getItem('auth_token');
await AsyncStorage.getItem('refresh_token');
```

### Check Network Requests
1. Open DevTools → Network tab
2. Look for `/trpc/*` requests
3. Check request/response bodies

### Common Issues

**"User already exists"**
- Try different email address
- Or delete user from Supabase Dashboard

**"Invalid or expired PIN"**
- PIN expires after 15 minutes
- Request new PIN
- Check console for correct PIN value

**"Password too weak"**
- Enter at least 6 character password
- Add uppercase, lowercase, numbers

**Session not persisting**
- Check AsyncStorage is working
- Verify tokens in browser storage
- Check `useAuthStore` subscription

## Next Steps

1. **Configure Real SMS Service**
   - Go to `utils/password-reset.ts`
   - Replace `sendPinToSms()` with real Twilio/Africa's Talking integration

2. **Configure Real Email Service**
   - Go to `utils/password-reset.ts`
   - Replace `sendPinToEmail()` with SendGrid/AWS SES integration

3. **Test on Mobile**
   - Run on iOS: `npm run ios`
   - Run on Android: `npm run android`
   - Test all flows on actual devices

4. **Deploy to Production**
   - Configure CORS in Supabase
   - Update environment variables
   - Use environment-specific endpoints

## Support

- Supabase Docs: https://supabase.com/docs
- tRPC Docs: https://trpc.io/docs
- Expo Docs: https://docs.expo.dev
