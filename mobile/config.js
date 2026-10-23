// This file builds the backend URL used by the mobile app.

// Import Constants so the app can read the address of the Expo development server.
import Constants from 'expo-constants';

// Set this to the computer's IPv4 address to force a specific host; leave empty to auto-detect.
const manualHost = '';

// Read the computer's address from Expo's hostUri value (for example "192.168.1.5:8081").
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];

// This is the fallback address used when Expo cannot provide a host (for example in a production build).
// It is the computer's usual LAN address; change it if the network assigns a different one.
const fallbackHost = '192.168.1.6';

// Prefer the manual override, then Expo's automatic address, then the fallback.
const host = manualHost || expoHost || fallbackHost;

// Build the exact API address, including the XAMPP folder name and the latest-reading action.
export const API_URL = `http://${host}/RoboTech(app_task)/backend/api.php?action=latest`;
