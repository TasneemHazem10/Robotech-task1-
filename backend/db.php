<?php

declare(strict_types=1);

function db(): PDO
{

    static $pdo = null;

if ($pdo instanceof PDO) {
        return $pdo;
    }

$config = require __DIR__ . '/config.php';

$dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['database']['host'],
        $config['database']['port'],
        $config['database']['name']
    );

$pdo = new PDO(
        $dsn,
        $config['database']['user'],
        $config['database']['password'],
        [

            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

return $pdo;
}
