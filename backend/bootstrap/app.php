<?php

/*
|--------------------------------------------------------------------------
| Registro del middleware IsAdmin en bootstrap/app.php (Laravel 11+)
|--------------------------------------------------------------------------
|
| Si usas Laravel 10 o anterior, registra el alias en
| app/Http/Kernel.php dentro de $routeMiddleware:
|
|   'is_admin' => \App\Http\Middleware\IsAdmin::class,
|
*/

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias para rutas
        $middleware->alias([
            'is_admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
