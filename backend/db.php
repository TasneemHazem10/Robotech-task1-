<?php
// This file creates the PDO connection that lets PHP talk to the XAMPP MySQL database.

// Strict types help catch accidental value-type mistakes in this file.
declare(strict_types=1);

// Define one function that every backend file can call to get a database connection.
function db(): PDO
{
    // "static" keeps the connection in memory so one request reuses the same connection.
    static $pdo = null;

    // If a connection already exists, return it immediately instead of opening another one.
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    // Load the shared database settings from config.php.
    $config = require __DIR__ . '/config.php';

    // Build the DSN string that PDO needs to find the MySQL server and database.
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['database']['host'],
        $config['database']['port'],
        $config['database']['name']
    );

    // Open the connection and configure how PDO should behave.
    $pdo = new PDO(
        $dsn,
        $config['database']['user'],
        $config['database']['password'],
        [
            // Throw an exception when a query fails instead of silently returning false.
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Return each row as an associative array, so $row['temperature'] works.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Use real prepared statements, which safely separate SQL from user values.
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    // Return the new connection to the caller.
    return $pdo;
}
