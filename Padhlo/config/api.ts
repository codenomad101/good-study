/**
 * API Configuration
 * 
 * Centralized configuration for API base URL.
 * Change the IP address here and it will be applied everywhere in the app.
 * 
 * For Android:
 * - Physical Device: Use your computer's IP address (e.g., 10.201.248.205)
 * - Emulator: Use 10.0.2.2 (emulator's alias for localhost)
 * 
 * Current IP: 10.201.248.205 (wlp1s0 interface)
 */

// Update this IP address when your network changes
const API_HOST = __DEV__ 
  ? '10.201.248.205'  // Your computer's IP address for Android app
  : 'localhost';      // Production (web)

const API_PORT = 3000;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

// Log the API URL being used for debugging
console.log('[API Config] Base URL configured:', API_BASE_URL);

