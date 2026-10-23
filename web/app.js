// This file fetches the newest sensor reading from the PHP API and updates the page.
// It uses a relative URL so the dashboard works from any XAMPP folder name.

// This is the backend endpoint that returns the latest temperature and humidity.
const API_URL = '../backend/api.php?action=latest';

// Fetch a fresh reading every three seconds so the dashboard feels live.
const REFRESH_MS = 3000;

// Find the element that displays the temperature number.
const temperatureEl = document.getElementById('temperature');

// Find the element that displays the humidity number.
const humidityEl = document.getElementById('humidity');

// Find the element that displays the connection message.
const statusTextEl = document.getElementById('status-text');

// Find the element that changes color to show the connection state.
const statusDotEl = document.getElementById('status-dot');

// Find the element that displays the timestamp of the newest reading.
const lastUpdateEl = document.getElementById('last-update');

// This flag prevents a slow request from starting a second request on top of it.
let isLoading = false;

// This function updates the status message and the colored dot together.
function setStatus(text, state) {
  // Replace the message with the new human-readable status.
  statusTextEl.textContent = text;

  // Replace the dot classes while keeping the base "dot" class for its size and shape.
  statusDotEl.className = 'dot ' + state;
}

// This async function reads one JSON response and paints it on the page.
async function loadReading() {
  // Skip this tick if the previous request is still running, which avoids overlapping requests.
  if (isLoading) {
    return;
  }

  // Mark a request as running before the network call starts.
  isLoading = true;

  // Always clear the busy flag, even when the request fails.
  try {
    // Call the API and bypass any cached response so the newest row is shown.
    const response = await fetch(API_URL, { cache: 'no-store' });

    // A non-200 HTTP status means the API or PHP failed, so treat it as an error.
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    // Convert the response body from JSON text into a JavaScript object.
    const data = await response.json();

    // Null values mean the database is connected but no sensor message has arrived yet.
    if (data.temperature === null || data.humidity === null) {
      // Tell the user that the backend is working and is waiting for MQTT data.
      setStatus('Waiting for sensor data…', 'waiting');

      // Clear any old timestamp so it cannot be mistaken for the current state.
      lastUpdateEl.textContent = '';

      // Stop here because there is no reading to display.
      return;
    }

    // Show the temperature with one decimal place for a stable, readable number.
    temperatureEl.textContent = Number(data.temperature).toFixed(1);

    // Show the humidity with one decimal place for a stable, readable number.
    humidityEl.textContent = Number(data.humidity).toFixed(1);

    // Show when the backend stored the newest reading.
    lastUpdateEl.textContent = 'Last reading: ' + data.created_at;

    // Mark the dashboard as online and say how often it refreshes.
    setStatus('Live · refreshes every 3 seconds', 'online');
  } catch (error) {
    // Keep the last known values on screen, but tell the user the backend is unreachable.
    setStatus('Cannot reach the backend. Is XAMPP running?', 'offline');
  } finally {
    // The request has finished, so allow the next refresh to start.
    isLoading = false;
  }
}

// Load a reading immediately instead of waiting three seconds for the first one.
loadReading();

// Schedule a new reading every three seconds to keep the page up to date.
setInterval(loadReading, REFRESH_MS);
