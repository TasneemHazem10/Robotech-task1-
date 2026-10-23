<?php
// This file is the small JSON API used by both the web dashboard and the mobile app.
// It returns the newest temperature and humidity reading from MySQL.

// Strict types keep the API output consistent.
declare(strict_types=1);

// Tell the browser, the web app and the mobile app that the response is JSON.
header('Content-Type: application/json; charset=utf-8');

// Allow the React Native app (and any other client) to call this API from another origin.
header('Access-Control-Allow-Origin: *');

// Allow only the GET method that this API actually supports.
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Stop browsers from showing an old reading from their cache.
header('Cache-Control: no-store');

// Answer the browser's CORS preflight request without doing any database work.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    // 204 means "success with no response body".
    http_response_code(204);

    // End the request here.
    exit;
}

// Load the database helper.
require __DIR__ . '/db.php';

// Run the API logic inside a try block so database errors become clean JSON errors.
try {
    // Get the shared database connection.
    $pdo = db();

    // Ask MySQL for the newest row only; "id DESC" is faster than sorting by date.
    $statement = $pdo->query(
        'SELECT temperature, humidity, created_at FROM sensor_readings ORDER BY id DESC LIMIT 1'
    );

    // Fetch the newest row, or false when the table is still empty.
    $row = $statement->fetch();

    // When no reading exists yet, return null values instead of an error.
    if ($row === false) {
        // The clients show a "waiting for data" state when the values are null.
        echo json_encode([
            'temperature' => null,
            'humidity' => null,
            'created_at' => null,
        ]);

        // Stop here because there is nothing else to return.
        exit;
    }

    // Return the reading as real JSON numbers so both clients can display them directly.
    echo json_encode([
        // Cast the decimal string from MySQL to a JSON number.
        'temperature' => (float) $row['temperature'],
        // Cast the decimal string from MySQL to a JSON number.
        'humidity' => (float) $row['humidity'],
        // Keep the database timestamp as a readable string.
        'created_at' => $row['created_at'],
    ]);
} catch (Throwable $error) {
    // Record the real error in the Apache/PHP log for debugging.
    error_log('RoboTech API error: ' . $error->getMessage());

    // Return a generic server error so internal details are not exposed.
    http_response_code(500);

    // Tell the clients that the API could not read the data.
    echo json_encode(['error' => 'Could not read sensor data.']);
}
