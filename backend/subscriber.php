<?php
// This script is the backend receiver: it stays connected to HiveMQ, reads sensor
// messages, validates the JSON and stores every reading in the MySQL database.

// Strict types catch value-type mistakes while this long-running script works.
declare(strict_types=1);

// Refuse to run from a browser, so an HTTP visitor cannot start an endless loop.
if (PHP_SAPI !== 'cli') {
    // Tell the browser that this script is not a web page.
    http_response_code(403);

    // Stop immediately without connecting to MQTT or MySQL.
    exit('This script must be run from the command line.');
}

// Load the database helper so this script can insert readings.
require __DIR__ . '/db.php';

// Load the small MQTT client class that talks to the public broker.
require __DIR__ . '/mqtt.php';

// Load the shared settings (broker address, topic and database details).
$config = require __DIR__ . '/config.php';

// Copy the MQTT settings into a short variable so the loop below stays readable.
$mqttConfig = $config['mqtt'];

// Store the exact topic in its own variable because it is used in log messages too.
$topic = $mqttConfig['topic'];

// This function prints a timestamped log line and flushes it immediately to the console.
function logLine(string $text): void
{
    // Print the local time first, then the message, then a new line.
    echo '[' . date('Y-m-d H:i:s') . '] ' . $text . PHP_EOL;

    // Force PHP to send the line to the console immediately instead of buffering it.
    flush();
}

// This function validates one MQTT message and inserts it into the database.
function storeReading(string $message): void
{
    // Decode the JSON text into a PHP associative array.
    $data = json_decode($message, true);

    // Reject anything that is not a JSON object with both required fields.
    if (!is_array($data) || !array_key_exists('temp', $data) || !array_key_exists('humidity', $data)) {
        // Explain why the message was ignored, including the original text.
        logLine('Ignored invalid message (expected {"temp": number, "humidity": number}): ' . $message);

        // Stop processing this message.
        return;
    }

    // Reject values that are not numbers, such as text or null.
    if (!is_numeric($data['temp']) || !is_numeric($data['humidity'])) {
        // Explain that the two fields must contain numbers.
        logLine('Ignored message because temp and humidity must be numbers: ' . $message);

        // Stop processing this message.
        return;
    }

    // Convert the temperature to a float so it can be stored safely.
    $temperature = (float) $data['temp'];

    // Convert the humidity to a float so it can be stored safely.
    $humidity = (float) $data['humidity'];

    // Prepare an INSERT statement; named parameters keep the SQL safe and readable.
    $statement = db()->prepare(
        'INSERT INTO sensor_readings (temperature, humidity) VALUES (:temperature, :humidity)'
    );

    // Execute the statement with the validated sensor values.
    $statement->execute([
        // Bind the temperature value to the matching placeholder.
        ':temperature' => $temperature,
        // Bind the humidity value to the matching placeholder.
        ':humidity' => $humidity,
    ]);

    // Print a confirmation line so the terminal shows the data was stored.
    logLine(sprintf('Stored reading: temperature=%s humidity=%s', $temperature, $humidity));
}

// Print a short startup banner so the user knows which topic is being watched.
logLine('Starting RoboTech MQTT subscriber for topic: ' . $topic);

// Keep reconnecting forever: an MVP daemon should survive network drops.
while (true) {
    // Start with no client; the catch block uses this variable to clean up safely.
    $client = null;

    // Catch every error here so one bad connection does not stop the whole script.
    try {
        // Build a unique client ID; a random suffix prevents collisions on the public broker.
        $clientId = $mqttConfig['client_id_prefix'] . bin2hex(random_bytes(4));

        // Create the MQTT client object.
        $client = new MqttClient();

        // Connect to the public broker and complete the MQTT handshake.
        $client->connect(
            $mqttConfig['host'],
            $mqttConfig['port'],
            $clientId,
            (int) $mqttConfig['keepalive']
        );

        // Subscribe to the exact topic that the sensor data is published to.
        $client->subscribe($topic);

        // Tell the user the receiver is ready.
        logLine('Connected to ' . $mqttConfig['host'] . ':' . $mqttConfig['port'] . ' as ' . $clientId);

        // Remember when the last ping was sent.
        $lastPing = time();

        // Stay in this loop while the connection is healthy.
        while (true) {
            // Wait up to one second for a sensor message.
            $message = $client->readMessage();

            // When a message arrived, validate it and save it to MySQL.
            if ($message !== null) {
                // This function contains all validation and the database insert.
                storeReading($message);
            }

            // Send a ping after half of the keep-alive interval has passed.
            if (time() - $lastPing >= max(5, intdiv($client->getKeepAlive(), 2))) {
                // Send the PINGREQ packet to keep the broker connection open.
                $client->ping();

                // Reset the ping timer.
                $lastPing = time();
            }
        }
    } catch (Throwable $error) {
        // Print the reason the connection stopped.
        logLine('ERROR: ' . $error->getMessage());

        // Close the socket if a client object was created before the failure.
        if ($client instanceof MqttClient) {
            // The disconnect method safely ignores an already-closed socket.
            $client->disconnect();
        }

        // Wait three seconds before trying again, to avoid a tight reconnect loop.
        sleep(3);
    }
}
