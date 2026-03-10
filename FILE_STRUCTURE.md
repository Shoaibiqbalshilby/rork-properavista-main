# Supabase Integration - File Structure & Changes

## New Files Created ✨

```
project-root/
├── .env.local                                    [NEW] Supabase credentials
├── IMPLEMENTATION_SUMMARY.md                     [NEW] What was built
├── SUPABASE_INTEGRATION.md                       [NEW] Detailed guide
├── TESTING_GUIDE.md                              [NEW] How to test
├── lib/
│   └── supabase.ts                              [NEW] Supabase client init
├── utils/
│   └── password-reset.ts                        [NEW] PIN utilities
└── backend/
    ├── db/
    │   └── schema.sql                           [NEW] Database tables & RLS
    └── trpc/
        └── routes/
            └── auth/
                ├── password-reset/
                │   └── route.ts                 [NEW] Request PIN endpoint
                ├── verify-pin/
                │   └── route.ts                 [NEW] Verify PIN endpoint
                └── confirm-reset/
                    └── route.ts                 [NEW] Confirm reset endpoint
```

## Modified Files 🔄

```
backend/
└── trpc/
    ├── app-router.ts                            [MODIFIED] Added 3 new routes
    ├── routes/
    │   └── auth/
    │       ├── login/
    │       │   └── route.ts                     [MODIFIED] Use Supabase Auth
    │       ├── signup/
    │       │   └── route.ts                     [MODIFIED] Use Supabase Auth
    │       └── me/
    │           └── route.ts                     [MODIFIED] Fetch user from DB

hooks/
└── useAuthStore.ts                              [MODIFIED] Complete rewrite

package.json                                      [MODIFIED] Added @supabase/supabase-js
```

---

## Detailed Changes by File

### `.env.local` [NEW]
```env
EXPO_PUBLIC_SUPABASE_URL=https://ceuhqekexyfikrxebvzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_URL=https://ceuhqekexyfikrxebvzd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### `lib/supabase.ts` [NEW]
**Provides:**
- `supabaseClient` - for frontend
- `supabaseAdmin` - for backend

### `backend/db/schema.sql` [NEW]
**Creates:**
- `public.user_profiles` table (87 lines)
- `public.password_reset_tokens` table (87 lines)
- RLS policies (40 lines)
- Indexes (6 lines)
- Triggers (10 lines)

### `utils/password-reset.ts` [NEW]
**Functions:**
- `generatePinCode()` - creates 6-digit PIN
- `validatePinFormat()` - validates format
- `formatPhoneNumber()` - formats Nigerian numbers
- `validatePhoneNumber()` - validates format
- `sendPinToEmail()` - mock email (ready for real)
- `sendPinToSms()` - mock SMS (ready for real)

### `backend/trpc/routes/auth/login/route.ts` [MODIFIED]
**Changes:**
- ❌ Removed: Mock login hardcoding
- ✅ Added: Real Supabase authentication
- ✅ Added: User profile fetching
- ✅ Added: Session token return
- **Lines changed:** 36 → 55

### `backend/trpc/routes/auth/signup/route.ts` [MODIFIED]
**Changes:**
- ❌ Removed: Mock signup logic
- ✅ Added: Real user creation in Auth
- ✅ Added: Profile creation in database
- ✅ Added: Auto-login after signup
- ✅ Added: Error handling with cleanup
- **Lines changed:** 22 → 78

### `backend/trpc/routes/auth/me/route.ts` [MODIFIED]
**Changes:**
- ❌ Removed: Returns null stub
- ✅ Added: Extract bearer token
- ✅ Added: Verify token with Supabase
- ✅ Added: Fetch user profile
- **Lines changed:** 6 → 43

### `backend/trpc/routes/auth/password-reset/route.ts` [NEW]
**Creates:**
- POST /trpc/auth.passwordReset
- Validates email + phone
- Generates PIN
- Stores in database
- Sends via SMS + Email (mocked)

### `backend/trpc/routes/auth/verify-pin/route.ts` [NEW]
**Creates:**
- POST /trpc/auth.verifyPin
- Validates PIN format
- Checks expiration
- Returns reset token

### `backend/trpc/routes/auth/confirm-reset/route.ts` [NEW]
**Creates:**
- POST /trpc/auth.confirmReset
- Validates PIN
- Updates password in Auth
- Marks PIN as used

### `backend/trpc/app-router.ts` [MODIFIED]
**Changes:**
- ✅ Added: Import passwordResetRoute
- ✅ Added: Import verifyPinRoute
- ✅ Added: Import confirmResetRoute
- ✅ Added: auth.passwordReset route
- ✅ Added: auth.verifyPin route
- ✅ Added: auth.confirmReset route

### `hooks/useAuthStore.ts` [MODIFIED]
**Changes (~250 line rewrite):**

**Old State:**
```typescript
user: User | null
isAuthenticated: boolean
isLoading: boolean
error: string | null
```

**New State:**
```typescript
user: User | null
session: Session | null          // NEW
isAuthenticated: boolean
isLoading: boolean
error: string | null
passwordReset: PasswordResetState // NEW
```

**Old Methods:**
```typescript
login(email, password)
signup(name, email, password)
logout()
clearError()
updateProfile(updates)
```

**New Methods:**
```typescript
login(email, password)                                    // UPDATED - real API
signup(name, email, password, phone?, whatsapp?)        // UPDATED - real API
logout()                                                  // UPDATED - clear tokens
clearError()
updateProfile(updates)
requestPasswordReset(email, phone)                       // NEW
verifyResetPin(email, pin)                              // NEW
confirmPasswordReset(email, pin, password)              // NEW
cancelPasswordReset()                                    // NEW
```

### `package.json` [MODIFIED]
**Added Dependency:**
```json
"@supabase/supabase-js": "^2.38.0"
```

---

## Code Statistics

| Metric | Count |
|--------|-------|
| New files | 8 |
| Modified files | 7 |
| Total new lines of code | ~1500+ |
| New backend endpoints | 3 |
| Database tables | 2 |
| RLS policies | 6 |
| Indexes | 5 |
| Test documentation pages | 3 |

---

## Implementation Timeline

### Phase 1: Core Setup ✅
- Environment variables (`.env.local`)
- Supabase clients (`lib/supabase.ts`)
- Database schema (`backend/db/schema.sql`)

### Phase 2: Authentication ✅
- Updated login endpoint
- Updated signup endpoint
- Updated user profile endpoint
- Updated auth store

### Phase 3: Password Reset ✅
- Request endpoint
- Verify endpoint
- Confirm endpoint
- Password reset utilities
- Auth store password reset methods

### Phase 4: Documentation ✅
- Integration guide
- Testing guide
- Implementation summary
- This file structure guide

---

## Testing the Implementation

### Minimal Test (1 minute)
```bash
# 1. Install
npm install

# 2. Setup database (Supabase SQL Editor)
# Copy backend/db/schema.sql → Execute

# 3. Start
npm start

# 4. Check
# - Open browser console
# - No errors should appear
```

### Sign Up Test (2 minutes)
```typescript
// In browser console or app
const { signup } = useAuthStore();
const result = await signup(
  'Test User',
  'test@example.com',
  'Password123',
  '08012345678'
);
console.log(result); // Should be true
```

### Login Test (2 minutes)
```typescript
const { logout, login } = useAuthStore();
logout();
const result = await login('test@example.com', 'Password123');
console.log(result); // Should be true
```

### Password Reset Test (3 minutes)
```typescript
const { requestPasswordReset, verifyResetPin, confirmPasswordReset } = 
  useAuthStore();

// Step 1: Request
await requestPasswordReset('test@example.com', '08012345678');
// Check console for PIN

// Step 2: Verify (use PIN from console)
await verifyResetPin('test@example.com', '123456');

// Step 3: Confirm
await confirmPasswordReset('test@example.com', '123456', 'NewPassword123');
```

---

## Migration Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with credentials
- [ ] Database schema executed in Supabase
- [ ] Old mock auth removed
- [ ] New Supabase auth integrated
- [ ] Sign up tested
- [ ] Login tested
- [ ] Password reset tested
- [ ] Session persistence verified
- [ ] Error handling tested
- [ ] Mobile app tested (iOS/Android)
- [ ] Real SMS service configured
- [ ] Real email service configured
- [ ] Production deployment checked

---

## Before & After Comparison

### Authentication Before
```typescript
// Mock login
if (email === 'demo@example.com' && password === 'password123') {
  return { success: true, user: {...} }; // Static user
}
throw new Error('Invalid credentials');
```

### Authentication After
```typescript
// Real Supabase auth
const { data, error } = await supabaseAdmin.auth.signInWithPassword(
  { email, password }
);
if (error) throw new Error(error.message);
// Fetch from actual database
const { data: profile } = await supabaseAdmin
  .from('user_profiles')
  .select('*')
  .eq('id', data.user.id)
  .single();
return { success: true, user: profile, session: data.session };
```

---

## Next: Integration Steps

1. **Execute Database Schema**
   - Supabase → SQL Editor → Copy `backend/db/schema.sql` → Execute

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm start
   ```

4. **Test All Flows**
   - Follow `TESTING_GUIDE.md`

5. **Configure Real Services**
   - Update `utils/password-reset.ts` with real SMS/Email

6. **Deploy to Mobile**
   ```bash
   npm run ios
   npm run android
   ```

---

**Status:** ✅ All code written and ready to test
