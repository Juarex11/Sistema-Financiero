<?php

return [
    /*
     * Orígenes permitidos para llamadas CORS.
     * Cambia la URL según tu entorno de frontend.
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:3000',  // alternativa CRA
        // Agrega tu dominio de producción aquí:
        // 'https://mi-app.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
