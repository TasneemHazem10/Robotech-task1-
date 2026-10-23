import Constants from 'expo-constants';

const manualHost = '';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];

const fallbackHost = '192.168.1.6';

const host = manualHost || expoHost || fallbackHost;

export const API_URL = `http://${host}/RoboTech(app_task)/backend/api.php?action=latest`;
