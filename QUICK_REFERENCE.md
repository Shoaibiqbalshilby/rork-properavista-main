# Quick Reference - Supabase Auth Commands

## Setup (First Time Only)

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Verify Environment Variables
Check `.env.local` exists:
```bash
cat .env.local
```

Should show:
```
EXPO_PUBLIC_SUPABASE_URL=https://ceuhqekexyfikrxebvzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Execute Database Schema
**In Supabase Dashboard:**
1. Go to `SQL Editor`
2. Click `+ New query`
3. Copy content from `backend/db/schema.sql`
4. Click `Run`
5. Verify tables created:
   - `user_profiles`
   - `password_reset_tokens`

**Or via terminal (with psql installed):**
```bash
psql postgresql://postgres:[PASSWORD]@db.ceuhqekexyfikrxebvzd.supabase.co:5432/postgres < backend/db/schema.sql
```

---

## Development

### Start Development Server
```bash
npm start
```

### Run on iOS
```bash
npm run ios
```

### Run on Android
```bash
npm run android
```

### Build for iOS
```bash
npm run bundle-ios
```

---

## Testing Commands

### Test Sign Up (via tRPC)
```typescript
// In browser console
const { signup } = useAuthStore();
const result = await signup(
  'John Doe',
  'john@example.com',
  'Password123',
  '08012345678',
  '08087654321'
);
console.log(result); // true if successful
```

### Test Login (via tRPC)
```typescript
const { login } = useAuthStore();
const result = await login('john@example.com', 'Password123');
console.log(result); // true if successful
```

### Test Current User
```typescript
const { user, isAuthenticated } = useAuthStore();
console.log(user); // User object or null
console.log(isAuthenticated); // true or false
```

### Test Password Reset - Step 1: Request PIN
```typescript
const { requestPasswordReset, passwordReset } = useAuthStore();
const result = await requestPasswordReset('john@example.com', '08012345678');
console.log(result); // true if successful
console.log(passwordReset.step); // 'verify'
// Check console for PIN code: "Sending PIN 123456 to SMS +2348012345678"
```

### Test Password Reset - Step 2: Verify PIN
```typescript
const { verifyResetPin } = useAuthStore();
// Use the PIN from console (e.g., 123456)
const result = await verifyResetPin('john@example.com', '123456');
console.log(result); // true if successful
```

### Test Password Reset - Step 3: Reset Password
```typescript
const { confirmPasswordReset } = useAuthStore();
const result = await confirmPasswordReset(
  'john@example.com',
  '123456',
  'NewPassword123'
);
console.log(result); // true if successful
```

### Test Logout
```typescript
const { logout } = useAuthStore();
logout();
// User should be null, isAuthenticated should be false
```

---

## Database Queries (Supabase SQL Editor)

### View All Users
```sql
SELECT id, email, created_at FROM auth.users;
```

### View All User Profiles
```sql
SELECT id, email, name, phone, whatsapp, created_at FROM public.user_profiles;
```

### View Recent Reset Tokens
```sql
SELECT user_id, pin_code, is_used, expires_at, created_at 
FROM public.password_reset_tokens 
ORDER BY created_at DESC 
LIMIT 10;
```

### Delete Test User
```sql
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### Check RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies;
```

---

## Debugging

### View Authentication Error
```typescript
const { error } = useAuthStore();
console.log(error); // Error message if any
```

### Check Session Tokens
```typescript
const { session } = useAuthStore();
console.log(session);
// {
//   accessToken: "...",
//   refreshToken: "...",
//   expiresIn: 3600,
//   expiresAt: 1234567890
// }
```

### Check Stored Tokens in AsyncStorage
```javascript
const token = await AsyncStorage.getItem('auth_token');
console.log('Access Token:', token);

const refreshToken = await AsyncStorage.getItem('refresh_token');
console.log('Refresh Token:', refreshToken);
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by `trpc`
3. Check request/response bodies

### View Browser Console Logs
```
[Mock] Sending PIN 123456 to SMS +2348012345678
[Mock] Sending PIN 123456 to email john@example.com
```

---

## Common Issues & Solutions

### Issue: "User already exists"
```typescript
// Solution 1: Use different email
await signup('User', 'newemail@example.com', 'Pass123', '08012345678');

// Solution 2: Delete user from Supabase Dashboard
// Auth → Users → Click user → Delete
```

### Issue: "Invalid or expired PIN"
```typescript
// Solution: Request new PIN (expires after 15 min)
await requestPasswordReset('email@example.com', '08012345678');
// Check console for new PIN
```

### Issue: "Password too weak"
```typescript
// Solution: Use password with 6+ characters
// Current minimum: 6 characters
// Recommended: Mix uppercase, lowercase, numbers
```

### Issue: "Invalid phone number"
```typescript
// Solution: Use valid Nigerian format
// Valid formats:
// - 08012345678
// - 0801 234 5678
// - +2348012345678
// - +234-801-234-5678
```

### Issue: "Session expired"
```typescript
// Solution: Login again
const { login } = useAuthStore();
await login('email@example.com', 'password');
```

### Issue: PIN not showing in console
```
// Make sure:
// 1. Browser console is open (F12)
// 2. Using development server (npm start)
// 3. Not in production build
// 4. Check for [Mock] prefix in console logs
```

---

## Environment Variables

### Required Variables (.env.local)
```env
# Supabase Project URL
EXPO_PUBLIC_SUPABASE_URL=https://ceuhqekexyfikrxebvzd.supabase.co

# Supabase Anon Key (safe for client)
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service Role Key (SERVER ONLY - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### What Each Variable Does
- `EXPO_PUBLIC_*` - Visible to client (safe to use in React)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only (use in backend tRPC routes)
- `EXPO_PUBLIC_SUPABASE_URL` - API endpoint for Supabase

---

## File Quick Links

| File | Purpose |
|------|---------|
| `.env.local` | Credentials |
| `lib/supabase.ts` | Client initialization |
| `backend/db/schema.sql` | Database setup |
| `backend/trpc/routes/auth/login/route.ts` | Login endpoint |
| `backend/trpc/routes/auth/signup/route.ts` | Signup endpoint |
| `backend/trpc/routes/auth/password-reset/route.ts` | Request PIN |
| `backend/trpc/routes/auth/verify-pin/route.ts` | Verify PIN |
| `backend/trpc/routes/auth/confirm-reset/route.ts` | Confirm reset |
| `hooks/useAuthStore.ts` | Frontend auth state |
| `utils/password-reset.ts` | PIN utilities |

---

## Documentation Files

- `IMPLEMENTATION_SUMMARY.md` - What was built
- `SUPABASE_INTEGRATION.md` - Detailed guide
- `TESTING_GUIDE.md` - How to test
- `FILE_STRUCTURE.md` - File organization
- This file - Quick commands

---

## Next Steps Checklist

- [ ] Run `npm install`
- [ ] Verify `.env.local` exists
- [ ] Execute `backend/db/schema.sql` in Supabase
- [ ] Run `npm start`
- [ ] Test signup
- [ ] Test login
- [ ] Test password reset
- [ ] Check Supabase dashboard for new users
- [ ] Test on mobile device
- [ ] Configure real SMS service
- [ ] Configure real email service

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **tRPC Docs:** https://trpc.io/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev

---

## Version Info

```
@supabase/supabase-js: ^2.38.0
expo: ^54.0.30
@trpc/server: ^11.3.1
@trpc/client: ^11.3.1
zustand: ^5.0.2
```

---

**Last Updated:** March 9, 2026
**Status:** ✅ Ready for Testing
