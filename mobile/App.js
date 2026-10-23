import { useEffect, useState } from 'react';

import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';

import { API_URL } from './config';

export default function App() {

  const [reading, setReading] = useState(null);

const [status, setStatus] = useState('loading');

useEffect(() => {

    let isActive = true;

const loadReading = async () => {

      try {

        const response = await fetch(API_URL);

if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

const data = await response.json();

if (!isActive) {
          return;
        }

setReading(data);

if (data.temperature === null || data.humidity === null) {

          setStatus('waiting');
        } else {

          setStatus('live');
        }
      } catch (error) {

        if (isActive) {
          setStatus('offline');
        }
      }
    };

loadReading();

const intervalId = setInterval(loadReading, 3000);

return () => {

      isActive = false;

clearInterval(intervalId);
    };
  }, []);

const hasReading = reading !== null && reading.temperature !== null && reading.humidity !== null;

let statusText = 'Connecting to the backend…';

if (status === 'live') {

    statusText = 'Live · refreshes every 3 seconds';
  } else if (status === 'waiting') {

    statusText = 'Waiting for sensor data…';
  } else if (status === 'offline') {

    statusText = 'Cannot reach the backend';
  }

const statusColor = status === 'live'
    ? '#1d7a46'
    : status === 'offline'
      ? '#c0492f'
      : '#d49a1f';

return (

    <View style={styles.screen}>

      <StatusBar style="dark" />

<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>

          <Text style={styles.eyebrow}>RoboTech · Smart Farm</Text>

<Text style={styles.title}>Live Sensor Readings</Text>

<Text style={styles.subtitle}>
            Temperature and humidity received from the IoT device over MQTT.
          </Text>
        </View>

<View style={styles.statusRow}>

          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

<Text style={styles.statusText}>{statusText}</Text>
        </View>

<View style={styles.cards}>

          <View style={styles.card}>

            <Text style={styles.cardIcon}>🌡️</Text>

<Text style={styles.cardLabel}>Temperature</Text>

<Text style={styles.cardValue}>

              {hasReading ? Number(reading.temperature).toFixed(1) : '--'}

              <Text style={styles.unit}> °C</Text>
            </Text>
          </View>

<View style={styles.card}>

            <Text style={styles.cardIcon}>💧</Text>

<Text style={styles.cardLabel}>Humidity</Text>

<Text style={styles.cardValue}>

              {hasReading ? Number(reading.humidity).toFixed(1) : '--'}

              <Text style={styles.unit}> %</Text>
            </Text>
          </View>
        </View>

<Text style={styles.lastUpdate}>

          {hasReading ? 'Last reading: ' + reading.created_at : 'No reading stored yet'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#f2f7f3',
  },

content: {
    paddingTop: Platform.OS === 'android' ? 56 : 64,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

header: {
    marginBottom: 22,
  },

eyebrow: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#1d7a46',
  },

title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0f2a1d',
  },

subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#577065',
  },

statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

statusText: {
    flexShrink: 1,
    fontSize: 13,
    color: '#577065',
  },

cards: {
    flexDirection: 'row',
    gap: 12,
  },

card: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(29, 122, 70, 0.14)',
    backgroundColor: '#ffffff',
    shadowColor: '#14462d',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

cardIcon: {
    marginBottom: 14,
    fontSize: 26,
  },

cardLabel: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#577065',
  },

cardValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f2a1d',
  },

unit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d7a46',
  },

lastUpdate: {
    marginTop: 18,
    fontSize: 12,
    textAlign: 'center',
    color: '#577065',
  },
});
