# Troubleshooting White Screen Issue

## Common Causes

1. **API Base URL Issue**: Android emulator needs `10.0.2.2` instead of `localhost`
   - Current setting: `http://10.0.2.2:3000/api` (should be correct for emulator)
   - For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:3000/api`)

2. **Network Permissions**: Ensure AndroidManifest.xml has internet permission
   - Should include: `<uses-permission android:name="android.permission.INTERNET" />`

3. **API Errors**: Check React Native debugger or Metro bundler console for errors
   - Look for failed fetch requests
   - Check authentication token issues

## Quick Fixes

### 1. Check API Connection
```bash
# Test if server is reachable from emulator
adb shell
curl http://10.0.2.2:3000/health
```

### 2. Update API Base URL
If using physical device, update in `Padhlo/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // Replace with your IP
  : 'https://your-production-url.com/api';
```

### 3. Check Console Logs
- Open React Native debugger
- Check for JavaScript errors
- Look for network request failures

### 4. Verify Authentication
- Make sure login is working
- Check if token is being stored
- Verify token format in AsyncStorage

## Testing Steps

1. Check if server is running: `curl http://localhost:3000/health`
2. Check app logs: `npx react-native log-android`
3. Check Metro bundler console for errors
4. Verify authentication flow works

## Common Error Messages

- "Network request failed" → API URL or network issue
- "401 Unauthorized" → Token missing or invalid
- "Failed to fetch" → CORS or network configuration


