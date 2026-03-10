∆# 📱 Authentication Screen Flow

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP OPENED                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Profile Tab    │
                    │                 │
                    │  Not Logged In  │
                    │  [Sign In]      │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN SCREEN                                │
│  app/login.tsx                                                   │
│                                                                  │
│  📧 Email                                                        │
│  🔒 Password                                                     │
│                                                                  │
│  [Sign In] ────────────────────┐                               │
│  [Demo Login] ─────────────────┤                               │
│  Forgot Password? ─────────────┼──────────────┐               │
│  Sign Up ──────────────────────┼───────┐      │               │
└────────────────────────────────┼───────┼──────┼───────────────┘
                                 │       │      │
                  ┌──────────────┘       │      │
                  │                      │      │
                  ▼                      │      │
         ┌────────────────┐             │      │
         │  Home Screen    │             │      │
         │  (Logged In)    │             │      │
         └────────────────┘             │      │
                                        │      │
                  ┌─────────────────────┘      │
                  │                            │
                  ▼                            │
┌─────────────────────────────────────────────┼──────────────────┐
│                  SIGNUP SCREEN               │                  │
│  app/signup.tsx                              │                  │
│                                              │                  │
│  👤 Full Name                                │                  │
│  📧 Email                                    │                  │
│  🔒 Password                                 │                  │
│  🔒 Confirm Password                         │                  │
│  📱 Phone Number (08012345678)               │                  │
│  📱 WhatsApp (optional)                      │                  │
│                                              │                  │
│  [Create Account] ──────────┐               │                  │
│  Already have account? Sign In ──────────────┘                  │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Success Alert        │
                  │  "Account created!"   │
                  │  Auto-login           │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Home Screen          │
                  │  (Logged In)          │
                  └───────────────────────┘
                              

┌─────────────────────────────────────────────────────────────────┐
│            PASSWORD RESET FLOW (3 STEPS)                        │
│  app/reset-password.tsx                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: REQUEST PIN                                            │
│  ╔═══════════╦═══════════╦═══════════╗                         │
│  ║ ① Request ║ 2 Verify  ║ 3 Reset   ║                         │
│  ╚═══════════╩═══════════╩═══════════╝                         │
│                                                                  │
│  Enter your details to receive a PIN:                           │
│                                                                  │
│  📧 Email Address                                               │
│  📱 Phone Number (08012345678)                                  │
│                                                                  │
│  [Send PIN] ───────────────────┐                               │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Backend Processing     │
                    │  • Validates email      │
                    │  • Validates phone      │
                    │  • Generates 6-digit PIN│
                    │  • Stores in database   │
                    │  • Sends to phone/email │
                    │  • (Logs in console)    │
                    └─────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: VERIFY PIN                                             │
│  ╔═══════════╦═══════════╦═══════════╗                         │
│  ║ 1 Request ║ ② Verify  ║ 3 Reset   ║                         │
│  ╚═══════════╩═══════════╩═══════════╝                         │
│                                                                  │
│  Enter the PIN sent to:                                         │
│  Phone: 08012345678                                             │
│  Email: john@example.com                                        │
│                                                                  │
│  🔍 Testing: Check browser console for PIN                      │
│                                                                  │
│  [6-digit PIN: 1 2 3 4 5 6]                                    │
│                                                                  │
│  [Verify PIN] ──────────────────┐                              │
│  Resend PIN ────────────────────┤ (back to step 1)            │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  PIN Validation         │
                     │  • Checks format        │
                     │  • Checks expiry        │
                     │  • Checks not used      │
                     │  • Returns reset token  │
                     └─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: RESET PASSWORD                                         │
│  ╔═══════════╦═══════════╦═══════════╗                         │
│  ║ 1 Request ║ 2 Verify  ║ ③ Reset   ║                         │
│  ╚═══════════╩═══════════╩═══════════╝                         │
│                                                                  │
│  Create a new password:                                         │
│                                                                  │
│  🔒 New Password                                                │
│  🔒 Confirm New Password                                        │
│                                                                  │
│  [Reset Password] ──────────────┐                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Password Update        │
                     │  • Validates password   │
                     │  • Updates in Supabase  │
                     │  • Marks PIN as used    │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Success Alert          │
                     │  "Password Reset!"      │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Login Screen           │
                     │  (Login with new pass)  │
                     └─────────────────────────┘


═══════════════════════════════════════════════════════════════════

PROFILE TAB STRUCTURE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  PROFILE TAB - NOT LOGGED IN                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 [User Icon]                                                 │
│                                                                  │
│  Guest User                                                      │
│                                                                  │
│  [Sign In] ────────────────────► Login Screen                  │
│                                                                  │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  ⚙️  Settings                                                   │
│  🔔 Notifications                                               │
│  🔒 Privacy Policy                                              │
│  ❓ Help and Support                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│  PROFILE TAB - LOGGED IN                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Profile Photo]                                                │
│                                                                  │
│  John Doe                                                        │
│  john@example.com                                               │
│  08012345678                                                     │
│                                                                  │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  🏠 My Properties                                               │
│  ❤️  Saved Properties                                           │
│  💬 Messages                [3]                                 │
│                                                                  │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  ⚙️  Settings                                                   │
│  🔔 Notifications                                               │
│  🔒 Privacy & Security                                          │
│  ❓ Help & Support                                              │
│  🚪 Log Out                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════

DATA FLOW (Backend Integration)
═══════════════════════════════════════════════════════════════════

SIGN UP:
  Frontend (signup.tsx)
       │
       ▼
  useAuthStore.signup(name, email, password, phone, whatsapp)
       │
       ▼
  tRPC: auth.signup
       │
       ▼
  Supabase Backend:
    • Create user in auth.users
    • Create profile in user_profiles
    • Auto-login
    • Return user + session tokens
       │
       ▼
  Store in Zustand + AsyncStorage
       │
       ▼
  Redirect to Home


LOGIN:
  Frontend (login.tsx)
       │
       ▼
  useAuthStore.login(email, password)
       │
       ▼
  tRPC: auth.login
       │
       ▼
  Supabase Backend:
    • Validate credentials
    • Fetch user profile
    • Return user + session tokens
       │
       ▼
  Store in Zustand + AsyncStorage
       │
       ▼
  Redirect to Home


RESET PASSWORD:
  Frontend (reset-password.tsx)
       │
       ▼ STEP 1
  useAuthStore.requestPasswordReset(email, phone)
       │
       ▼
  tRPC: auth.passwordReset
       │
       ▼
  Supabase Backend:
    • Validate user exists
    • Generate 6-digit PIN
    • Store in password_reset_tokens
    • Send PIN (mocked - logs to console)
       │
       ▼ STEP 2
  useAuthStore.verifyResetPin(email, pin)
       │
       ▼
  tRPC: auth.verifyPin
       │
       ▼
  Supabase Backend:
    • Validate PIN format
    • Check not expired
    • Check not used
    • Return reset token
       │
       ▼ STEP 3
  useAuthStore.confirmPasswordReset(email, pin, newPassword)
       │
       ▼
  tRPC: auth.confirmReset
       │
       ▼
  Supabase Backend:
    • Update password in auth.users
    • Mark PIN as used
       │
       ▼
  Success → Redirect to Login


═══════════════════════════════════════════════════════════════════

TESTING QUICK START
═══════════════════════════════════════════════════════════════════

1. START APP
   $ npm start

2. TEST SIGN UP
   Profile → Sign In → Sign Up
   • Name: John Doe
   • Email: john@example.com
   • Password: Password123
   • Confirm: Password123
   • Phone: 08012345678
   • WhatsApp: 08087654321
   ► Click "Create Account"
   ► Should see success alert
   ► Auto-logged in

3. TEST LOGIN
   • Logout from profile
   • Profile → Sign In
   • Email: john@example.com
   • Password: Password123
   ► Click "Sign In"
   ► Should login successfully

4. TEST RESET PASSWORD
   • Logout
   • Login screen → "Forgot Password?"
   • Email: john@example.com
   • Phone: 08012345678
   ► Click "Send PIN"
   ► Check console for PIN (e.g., 123456)
   ► Enter PIN from console
   ► Click "Verify PIN"
   ► Enter new password
   ► Click "Reset Password"
   ► Login with new password

═══════════════════════════════════════════════════════════════════
