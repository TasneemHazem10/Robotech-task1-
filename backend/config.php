<?php

declare(strict_types=1);

date_default_timezone_set('Africa/Cairo');

return [

    'database' => [

        'host' => '127.0.0.1',

        'port' => 3306,

        'name' => 'robotech_farm',

        'user' => 'root',

        'password' => '',
    ],

    'mqtt' => [

        'host' => 'broker.hivemq.com',

        'port' => 1883,

        'topic' => 'robotech/smart-farm/readings',

        'client_id_prefix' => 'robotech_php_',

        'keepalive' => 30,
    ],
];
