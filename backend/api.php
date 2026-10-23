<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/db.php';

try {
    $pdo = db();
    $statement = $pdo->query(
        'SELECT temperature, humidity, created_at FROM sensor_readings ORDER BY id DESC LIMIT 1'
    );
    $row = $statement->fetch();

    if ($row === false) {
        echo json_encode([
            'temperature' => null,
            'humidity' => null,
            'created_at' => null,
        ]);
        exit;
    }

    echo json_encode([
        'temperature' => (float) $row['temperature'],
        'humidity' => (float) $row['humidity'],
        'created_at' => $row['created_at'],
    ]);
} catch (Throwable $error) {
    error_log('RoboTech API error: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Could not read sensor data.']);
}
