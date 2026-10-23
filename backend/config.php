<?php
// This file is the single place that holds the database and MQTT settings.
// Every backend file reads these values, so changing a setting here changes the whole app.

// Strict types make PHP stop on accidental type mistakes instead of hiding them.
declare(strict_types=1);

// Use the same time zone as the MySQL server so terminal logs and stored timestamps match.
date_default_timezone_set('Africa/Cairo');

// Return one configuration array that the other PHP files can load with "require".
return [
    // This group contains the MySQL connection details used by XAMPP.
    'database' => [
        // The database server runs on the same computer as XAMPP, so 127.0.0.1 is enough.
        'host' => '127.0.0.1',
        // This is the default MySQL port that XAMPP uses.
        'port' => 3306,
        // This is the database created by database.sql in the project root.
        'name' => 'robotech_farm',
        // This is the default XAMPP MySQL user.
        'user' => 'root',
        // XAMPP's default MySQL password is empty; change it here if your setup has one.
        'password' => '',
    ],
    // This group contains the public MQTT broker details.
    'mqtt' => [
        // HiveMQ offers this free public broker, which the task recommends for testing.
        'host' => 'broker.hivemq.com',
        // Port 1883 is the standard unencrypted MQTT port used by the public broker.
        'port' => 1883,
        // This exact topic is documented in README.md and used for all test messages.
        'topic' => 'robotech/smart-farm/readings',
        // A prefix plus a random value keeps every subscriber client ID unique on the public broker.
        'client_id_prefix' => 'robotech_php_',
        // The broker expects a ping every 30 seconds to keep the connection open.
        'keepalive' => 30,
    ],
];
