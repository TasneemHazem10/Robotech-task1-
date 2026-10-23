<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {

    http_response_code(403);

exit('This script must be run from the command line.');
}

require __DIR__ . '/db.php';

require __DIR__ . '/mqtt.php';

$config = require __DIR__ . '/config.php';

$mqttConfig = $config['mqtt'];

$topic = $mqttConfig['topic'];

function logLine(string $text): void
{

    echo '[' . date('Y-m-d H:i:s') . '] ' . $text . PHP_EOL;

flush();
}

function storeReading(string $message): void
{

    $data = json_decode($message, true);

if (!is_array($data) || !array_key_exists('temp', $data) || !array_key_exists('humidity', $data)) {

        logLine('Ignored invalid message (expected {"temp": number, "humidity": number}): ' . $message);

return;
    }

if (!is_numeric($data['temp']) || !is_numeric($data['humidity'])) {

        logLine('Ignored message because temp and humidity must be numbers: ' . $message);

return;
    }

$temperature = (float) $data['temp'];

$humidity = (float) $data['humidity'];

$statement = db()->prepare(
        'INSERT INTO sensor_readings (temperature, humidity) VALUES (:temperature, :humidity)'
    );

$statement->execute([

        ':temperature' => $temperature,

        ':humidity' => $humidity,
    ]);

logLine(sprintf('Stored reading: temperature=%s humidity=%s', $temperature, $humidity));
}

logLine('Starting RoboTech MQTT subscriber for topic: ' . $topic);

while (true) {

    $client = null;

try {

        $clientId = $mqttConfig['client_id_prefix'] . bin2hex(random_bytes(4));

$client = new MqttClient();

$client->connect(
            $mqttConfig['host'],
            $mqttConfig['port'],
            $clientId,
            (int) $mqttConfig['keepalive']
        );

$client->subscribe($topic);

logLine('Connected to ' . $mqttConfig['host'] . ':' . $mqttConfig['port'] . ' as ' . $clientId);

$lastPing = time();

while (true) {

            $message = $client->readMessage();

if ($message !== null) {

                storeReading($message);
            }

if (time() - $lastPing >= max(5, intdiv($client->getKeepAlive(), 2))) {

                $client->ping();

$lastPing = time();
            }
        }
    } catch (Throwable $error) {

        logLine('ERROR: ' . $error->getMessage());

if ($client instanceof MqttClient) {

            $client->disconnect();
        }

sleep(3);
    }
}
