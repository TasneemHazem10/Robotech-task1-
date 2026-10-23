const API_URL = '../backend/api.php?action=latest';

const REFRESH_MS = 3000;

const temperatureEl = document.getElementById('temperature');

const humidityEl = document.getElementById('humidity');

const statusTextEl = document.getElementById('status-text');

const statusDotEl = document.getElementById('status-dot');

const lastUpdateEl = document.getElementById('last-update');

let isLoading = false;

function setStatus(text, state) {

  statusTextEl.textContent = text;

statusDotEl.className = 'dot ' + state;
}

async function loadReading() {

  if (isLoading) {
    return;
  }

isLoading = true;

try {

    const response = await fetch(API_URL, { cache: 'no-store' });

if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

const data = await response.json();

if (data.temperature === null || data.humidity === null) {

      setStatus('Waiting for sensor data…', 'waiting');

lastUpdateEl.textContent = '';

return;
    }

temperatureEl.textContent = Number(data.temperature).toFixed(1);

humidityEl.textContent = Number(data.humidity).toFixed(1);

lastUpdateEl.textContent = 'Last reading: ' + data.created_at;

setStatus('Live · refreshes every 3 seconds', 'online');
  } catch (error) {

    setStatus('Cannot reach the backend. Is XAMPP running?', 'offline');
  } finally {

    isLoading = false;
  }
}

loadReading();

setInterval(loadReading, REFRESH_MS);
