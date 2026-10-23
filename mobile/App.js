// Import two React hooks: useEffect runs the polling loop, useState stores the data and status.
import { useEffect, useState } from 'react';

// Import the React Native building blocks used by this screen.
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

// Import Expo's status bar component so the phone status bar matches the light design.
import { StatusBar } from 'expo-status-bar';

// Import the API address that config.js builds for the current computer.
import { API_URL } from './config';

// App is the root component that Expo renders when the mobile app starts.
export default function App() {
  // This state holds the newest reading object, or null before the first response arrives.
  const [reading, setReading] = useState(null);

  // This state tracks the connection state: loading, live, waiting or offline.
  const [status, setStatus] = useState('loading');

  // useEffect starts polling when the screen appears and stops it when the screen closes.
  useEffect(() => {
    // This flag prevents React state updates after the component has been unmounted.
    let isActive = true;

    // This async function fetches one reading from the PHP API.
    const loadReading = async () => {
      // The try block handles network and JSON errors without crashing the app.
      try {
        // Call the API endpoint that returns the latest temperature and humidity.
        const response = await fetch(API_URL);

        // A non-200 response means the API or PHP failed, so treat it as an error.
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        // Convert the JSON response body into a JavaScript object.
        const data = await response.json();

        // Stop if the screen was closed while the request was running.
        if (!isActive) {
          return;
        }

        // Save the newest reading so the cards can display it.
        setReading(data);

        // Null values mean the API works but no MQTT message has been stored yet.
        if (data.temperature === null || data.humidity === null) {
          // Show the "waiting" state until the subscriber stores a reading.
          setStatus('waiting');
        } else {
          // Real values mean the app is receiving live data.
          setStatus('live');
        }
      } catch (error) {
        // Any network or parsing error is shown as an offline state.
        if (isActive) {
          setStatus('offline');
        }
      }
    };

    // Fetch once immediately so the screen does not stay empty for three seconds.
    loadReading();

    // Repeat the request every three seconds to keep the values live.
    const intervalId = setInterval(loadReading, 3000);

    // Cleanup runs when the screen closes: stop the timer and ignore late responses.
    return () => {
      // Prevent state updates after unmounting.
      isActive = false;

      // Stop the repeating fetch.
      clearInterval(intervalId);
    };
  }, []);

  // A reading is displayable only when the object exists and both values are not null.
  const hasReading = reading !== null && reading.temperature !== null && reading.humidity !== null;

  // This variable holds the message shown next to the status dot.
  let statusText = 'Connecting to the backend…';

  // Once data is flowing, explain how often the screen refreshes.
  if (status === 'live') {
    // Tell the user the app is connected and live.
    statusText = 'Live · refreshes every 3 seconds';
  } else if (status === 'waiting') {
    // Tell the user the backend works but no sensor message has arrived yet.
    statusText = 'Waiting for sensor data…';
  } else if (status === 'offline') {
    // Tell the user the API cannot be reached.
    statusText = 'Cannot reach the backend';
  }

  // Pick the dot color that matches the current state.
  const statusColor = status === 'live'
    ? '#1d7a46' // Green means the data is live.
    : status === 'offline'
      ? '#c0492f' // Red means the backend is unreachable.
      : '#d49a1f'; // Amber means the app is loading or waiting.

  // Return the screen that the user sees.
  return (
    // The root view fills the screen and uses the light farm-themed background.
    <View style={styles.screen}>
      {/* Use dark status bar icons because the background is light. */}
      <StatusBar style="dark" />

      {/* ScrollView keeps the content usable on small screens without cutting it off. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* The header introduces the app and the data source. */}
        <View style={styles.header}>
          {/* The small brand label above the title. */}
          <Text style={styles.eyebrow}>RoboTech · Smart Farm</Text>

          {/* The main title of the screen. */}
          <Text style={styles.title}>Live Sensor Readings</Text>

          {/* One short sentence explaining where the values come from. */}
          <Text style={styles.subtitle}>
            Temperature and humidity received from the IoT device over MQTT.
          </Text>
        </View>

        {/* The status row combines a colored dot with a readable message. */}
        <View style={styles.statusRow}>
          {/* The dot color is chosen dynamically from the current status. */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

          {/* The message explains the current connection state. */}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* The cards row holds the two sensor measurements side by side. */}
        <View style={styles.cards}>
          {/* Temperature card. */}
          <View style={styles.card}>
            {/* A decorative icon for temperature. */}
            <Text style={styles.cardIcon}>🌡️</Text>

            {/* The measurement name. */}
            <Text style={styles.cardLabel}>Temperature</Text>

            {/* The number shows one decimal place, or "--" before the first reading. */}
            <Text style={styles.cardValue}>
              {/* Show the stored temperature when available; otherwise show a placeholder. */}
              {hasReading ? Number(reading.temperature).toFixed(1) : '--'}
              {/* The unit is smaller than the number and uses a nested Text style. */}
              <Text style={styles.unit}> °C</Text>
            </Text>
          </View>

          {/* Humidity card, using the same structure as the temperature card. */}
          <View style={styles.card}>
            {/* A decorative icon for humidity. */}
            <Text style={styles.cardIcon}>💧</Text>

            {/* The measurement name. */}
            <Text style={styles.cardLabel}>Humidity</Text>

            {/* The number shows one decimal place, or "--" before the first reading. */}
            <Text style={styles.cardValue}>
              {/* Show the stored humidity when available; otherwise show a placeholder. */}
              {hasReading ? Number(reading.humidity).toFixed(1) : '--'}
              {/* The percent unit is smaller than the number. */}
              <Text style={styles.unit}> %</Text>
            </Text>
          </View>
        </View>

        {/* This line shows when the newest reading was stored by the backend. */}
        <Text style={styles.lastUpdate}>
          {/* Explain the timestamp when data exists, or explain that the database is still empty. */}
          {hasReading ? 'Last reading: ' + reading.created_at : 'No reading stored yet'}
        </Text>
      </ScrollView>
    </View>
  );
}

// StyleSheet keeps every visual rule in one place and lets React Native optimize them.
const styles = StyleSheet.create({
  // The root view fills the device screen and sets the page background.
  screen: {
    flex: 1, // Stretch the root view to the whole screen.
    backgroundColor: '#f2f7f3', // Soft green-white background.
  },

  // The scroll content adds safe spacing around the dashboard.
  content: {
    paddingTop: Platform.OS === 'android' ? 56 : 64, // Leave room below the phone status bar.
    paddingHorizontal: 20, // Keep cards away from the left and right edges.
    paddingBottom: 40, // Leave room below the last line when scrolling.
  },

  // The header group sits above the cards.
  header: {
    marginBottom: 22, // Space between the header and the status row.
  },

  // The small brand label uses the RoboTech green.
  eyebrow: {
    marginBottom: 10, // Space between the label and the title.
    fontSize: 12, // Small label text.
    fontWeight: '700', // Bold weight to make the label stand out.
    letterSpacing: 1.8, // Wide spacing for a modern look.
    textTransform: 'uppercase', // Display the label in capital letters.
    color: '#1d7a46', // Green accent color.
  },

  // The main title is large but still fits on one or two lines.
  title: {
    fontSize: 32, // Large heading size for a phone screen.
    fontWeight: '800', // Extra bold weight.
    letterSpacing: -0.5, // Slightly tighten the letters.
    color: '#0f2a1d', // Dark green text.
  },

  // The subtitle explains the data source in smaller text.
  subtitle: {
    marginTop: 8, // Space between the title and this text.
    fontSize: 14, // Comfortable reading size.
    lineHeight: 21, // Space between wrapped lines.
    color: '#577065', // Muted green-grey color.
  },

  // The status row places the dot and its message on one line.
  statusRow: {
    flexDirection: 'row', // Lay the children out horizontally.
    alignItems: 'center', // Center the dot and text vertically.
    gap: 8, // Space between the dot and the text.
    marginBottom: 16, // Space between the status row and the cards.
  },

  // The status dot is a tiny colored circle.
  statusDot: {
    width: 9, // Dot width.
    height: 9, // Dot height.
    borderRadius: 5, // Half of the width creates a perfect circle.
  },

  // The status message uses small secondary text.
  statusText: {
    flexShrink: 1, // Allow the text to wrap instead of overflowing on narrow screens.
    fontSize: 13, // Small status text size.
    color: '#577065', // Muted green-grey color.
  },

  // The cards row shows temperature and humidity side by side.
  cards: {
    flexDirection: 'row', // Place the two cards in one row.
    gap: 12, // Space between the two cards.
  },

  // Each card is a white rounded panel.
  card: {
    flex: 1, // Make both cards share the available width equally.
    padding: 18, // Inner spacing around the card content.
    borderRadius: 20, // Rounded card corners.
    borderWidth: 1, // Thin border around the card.
    borderColor: 'rgba(29, 122, 70, 0.14)', // Subtle green border.
    backgroundColor: '#ffffff', // White card background.
    shadowColor: '#14462d', // Shadow color for iOS.
    shadowOpacity: 0.08, // Very soft shadow.
    shadowRadius: 14, // Spread the shadow softly.
    shadowOffset: { width: 0, height: 8 }, // Push the shadow downward.
    elevation: 2, // Android shadow equivalent.
  },

  // The decorative emoji sits above the card label.
  cardIcon: {
    marginBottom: 14, // Space between the icon and the label.
    fontSize: 26, // Large enough to recognize quickly.
  },

  // The card label is small uppercase text.
  cardLabel: {
    marginBottom: 6, // Space between the label and the number.
    fontSize: 11, // Small label size.
    fontWeight: '700', // Bold enough to separate it from the value.
    letterSpacing: 0.8, // Slight letter spacing.
    textTransform: 'uppercase', // Keep both card labels consistent.
    color: '#577065', // Muted green-grey color.
  },

  // The card value is the most important number on the screen.
  cardValue: {
    fontSize: 34, // Large, easy-to-read number.
    fontWeight: '800', // Extra bold weight.
    color: '#0f2a1d', // Dark green text.
  },

  // The unit is smaller than the number but still readable.
  unit: {
    fontSize: 15, // Small unit size.
    fontWeight: '600', // Semi-bold weight.
    color: '#1d7a46', // Green accent color.
  },

  // The timestamp sits below the cards.
  lastUpdate: {
    marginTop: 18, // Space between the cards and the timestamp.
    fontSize: 12, // Small secondary text.
    textAlign: 'center', // Center the timestamp under the cards.
    color: '#577065', // Muted green-grey color.
  },
});
