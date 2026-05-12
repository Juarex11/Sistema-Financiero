<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| Rutas públicas (sin autenticación)
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren token Sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Sesión
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ─── Rutas solo para ADMIN ────────────────────────────────────────────
    Route::middleware('is_admin')->prefix('admin')->group(function () {

        Route::get('/users', function () {
            return \App\Models\User::select('id', 'name', 'email', 'role', 'created_at')->get();
        });

        Route::delete('/users/{user}', function (\App\Models\User $user) {
            $user->delete();
            return response()->json(['message' => 'Usuario eliminado.']);
        });
    });

    // ─── Rutas accesibles para cualquier usuario autenticado ──────────────
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'message' => 'Bienvenido, ' . $request->user()->name,
            'role'    => $request->user()->role,
        ]);
    });
});
