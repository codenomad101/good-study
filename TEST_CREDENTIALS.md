# 🚀 Padhlo App - Test Credentials

## Dummy Login Credentials

You can now test the Android app using these dummy credentials:

### **Login Credentials:**
- **Email:** `test@padhlo.com`
- **Password:** `password123`

### **Registration:**
- You can also register with the same email `test@padhlo.com` and any password
- The app will automatically log you in after registration

## How to Test:

1. **Start the Mobile App:**
   ```bash
   cd Padhlo
   npm start
   ```

2. **Run on Android:**
   - Scan QR code with Expo Go app
   - Or use Android emulator

3. **Login Process:**
   - Open the app
   - Enter email: `test@padhlo.com`
   - Enter password: `password123`
   - Tap "Sign In"

4. **Features to Test:**
   - ✅ Login/Logout functionality
   - ✅ Native tab navigation with proper icons (Home, Practice, Progress, Community)
   - ✅ Responsive design on different screen sizes
   - ✅ User profile display
   - ✅ All UI components and animations
   - ✅ Tab switching with proper content rendering
   - ✅ Proper safe area handling (no overlap with status bar)
   - ✅ Tab icons with focus states and proper colors

## Backend Integration Notes:

- The app currently uses **dummy authentication** for testing
- When your backend database is ready, you can:
  1. Remove the dummy login code from `contexts/AuthContext.tsx`
  2. Uncomment the real API calls
  3. The app will automatically connect to your backend

## Next Steps:

1. Test the app with dummy credentials
2. Set up PostgreSQL permissions
3. Run database migrations
4. Switch to real backend integration

The app is fully functional with the dummy system and ready for testing! 🎉
