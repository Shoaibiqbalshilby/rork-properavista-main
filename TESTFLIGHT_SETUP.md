# TestFlight Setup Guide for Real Device Testing

## Problem
When testing on a real iOS device via TestFlight, the app shows "Network request failed" during signup because it cannot reach the backend server.

## Root Cause
On a real device, the app cannot connect to `localhost:8787` (local backend). The backend needs to be accessible from a real URL.

---

## Solution: Setup Backend for TestFlight Testing

### Option 1: Run Backend on Local Machine (Network Accessible) ⚡ RECOMMENDED FOR QUICK TESTING

1. **Find your Mac's IP address on the local network:**
   ```bash
   # On Mac, open Terminal and run:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example output: inet 192.168.1.100 netmask ...
   # Your IP is: 192.168.1.100
   ```

2. **Start the backend server (make sure it's listening on 0.0.0.0):**
   ```bash
   npm run backend
   # Should output: Properavista backend listening on http://0.0.0.0:8787
   ```

3. **Build and push a new TestFlight build with the environment variable:**
   ```bash
   # Set environment variable before building
   export EXPO_PUBLIC_API_BASE_URL="http://192.168.1.100:8787/api"
   
   # Build for TestFlight
   eas build --platform ios --profile production
   
   # Upload to TestFlight
   eas submit --platform ios --latest
   ```

4. **On your iOS device, make sure you're on the same WiFi network** as your Mac.

5. **Install the TestFlight build and test signup**

---

### Option 2: Deploy Backend to Cloud ☁️ PRODUCTION SETUP

For production TestFlight and beyond, deploy the backend to a service:

**Popular options:**
- **Vercel** (recommended, free tier)
- **Heroku**
- **Railway**
- **AWS Lambda**
- **Google Cloud Run**

**Steps:**
1. Deploy backend to your chosen service
2. Get the public URL (e.g., `https://properavista-api.vercel.app`)
3. Set environment variable:
   ```bash
   export EXPO_PUBLIC_API_BASE_URL="https://properavista-api.vercel.app/api"
   ```
4. Build TestFlight version with that environment variable
5. Submit to TestFlight

---

## Building for TestFlight with Environment Variable

### Using `.env` file (EAS Build)
Create `.env.production.local`:
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8787/api
```

Then build:
```bash
eas build --platform ios --profile production
```

### Using command line
```bash
export EXPO_PUBLIC_API_BASE_URL="http://192.168.1.100:8787/api"
eas build --platform ios --profile production
```

---

## Testing Checklist

After building and installing on TestFlight:

✅ **Signup Test:**
- [ ] Open app → Signup screen
- [ ] Fill in: Name, Email, Password (confirm), Phone, WhatsApp (optional)
- [ ] Click "Create Account"
- [ ] **Should succeed** (previously showed "Network request failed")
- [ ] Check email for verification PIN
- [ ] Enter PIN and complete verification

✅ **Login Test:**
- [ ] Go to Login screen
- [ ] Use same email/password
- [ ] Should sign in successfully

✅ **Network Verification:**
- [ ] If still seeing "Network request failed", check:
  - [ ] Is the backend server running?
  - [ ] Is the device on the same WiFi network?
  - [ ] Is the IP address in `EXPO_PUBLIC_API_BASE_URL` correct?
  - [ ] Can you ping the Mac from the device?

---

## Debugging Network Issues

### From your iOS device:

1. **Check connectivity:**
   - Open Safari on the device
   - Try to navigate to `http://192.168.1.100:8787`
   - Should see response from backend

2. **Check server logs:**
   - Watch the terminal running the backend
   - Should see HTTP POST requests to `/auth/signup/request`

3. **Enable verbose logging (optional):**
   - Modify `lib/trpc.ts` to log API URLs
   - Check network inspector in Xcode

---

## Environment Variable Priority (How It Works)

1. **EXPO_PUBLIC_API_BASE_URL** (use this for TestFlight)
2. **Constants.expoConfig.hostUri** (Expo Go / dev client only)
3. **Fallback to localhost:8787** (dev/emulator only)

---

## After Testing: Going to Production

1. Deploy backend to a real server with SSL (https)
2. Set `EXPO_PUBLIC_API_BASE_URL` to your production backend URL
3. Build and submit final TestFlight version
4. Once approved, users will connect to your real API

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Network request failed" | Set EXPO_PUBLIC_API_BASE_URL before building |
| Device can't reach backend | Make sure device is on same WiFi, backend is running on 0.0.0.0 |
| HTTP status 500 from backend | Check backend terminal logs, server may have crashed |
| Email not received | Configure email provider (Supabase, SendGrid, or SMTP) in .env.local |

---

## Questions?

Check these docs:
- [README_SUPABASE.md](./README_SUPABASE.md) - Supabase setup
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Full testing guide
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Commands reference
