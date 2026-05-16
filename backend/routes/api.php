<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TestimonioController;
use App\Http\Controllers\AnuncioController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\IngresoController;

/*
|--------------------------------------------------------------------------
| Rutas públicas
|--------------------------------------------------------------------------
*/
Route::post('/login',      [AuthController::class, 'login']);
Route::get('/testimonios', [TestimonioController::class, 'publico']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Sesión
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Perfil
    Route::put   ('/me',          [ProfileController::class, 'update']);
    Route::post  ('/me/photo',    [ProfileController::class, 'uploadPhoto']);
    Route::delete('/me/photo',    [ProfileController::class, 'removePhoto']);
    Route::put   ('/me/password', [ProfileController::class, 'changePassword']);

    // Onboarding ← NUEVO
    Route::get ('/onboarding', [OnboardingController::class, 'estado']);
    Route::post('/onboarding', [OnboardingController::class, 'guardar']);

     // Configuración de ingresos
    Route::get ('/ingresos/config', [IngresoController::class, 'config']);
    Route::post('/ingresos/config', [IngresoController::class, 'guardarConfig']);

    // Ingresos
    Route::get   ('/ingresos',                    [IngresoController::class, 'index']);
    Route::post  ('/ingresos',                    [IngresoController::class, 'store']);
    Route::put   ('/ingresos/{ingreso}',          [IngresoController::class, 'update']);
    Route::delete('/ingresos/{ingreso}',          [IngresoController::class, 'destroy']);
    Route::patch ('/ingresos/{ingreso}/confirmar',[IngresoController::class, 'confirmar']);

    // Testimonios (usuario)
    Route::get   ('/testimonios/mio', [TestimonioController::class, 'mio']);
    Route::post  ('/testimonios',     [TestimonioController::class, 'guardar']);
    Route::delete('/testimonios/mio', [TestimonioController::class, 'eliminarMio']);

    // Anuncios (usuario)
    Route::get ('/anuncios',                      [AnuncioController::class, 'index']);
    Route::post('/anuncios/{anuncio}/reaccionar', [AnuncioController::class, 'reaccionar']);

    // Dashboard
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'message' => 'Bienvenido, ' . $request->user()->name,
            'role'    => $request->user()->role,
        ]);
    });

    // ── Agenda ────────────────────────────────────────────────────────────────
    Route::prefix('agenda')->group(function () {

        Route::get('/resumen', [AgendaController::class, 'resumen']);

        Route::get   ('/',         [AgendaController::class, 'index']);
        Route::post  ('/',         [AgendaController::class, 'store']);
        Route::get   ('/{evento}', [AgendaController::class, 'show']);
        Route::put   ('/{evento}', [AgendaController::class, 'update']);
        Route::delete('/{evento}', [AgendaController::class, 'destroy']);

        Route::patch('/{evento}/estado', [AgendaController::class, 'cambiarEstado']);

        Route::post  ('/{evento}/contactos',            [AgendaController::class, 'agregarContacto']);
        Route::delete('/{evento}/contactos/{contacto}', [AgendaController::class, 'eliminarContacto']);

        Route::post  ('/{evento}/notas',        [AgendaController::class, 'agregarNota']);
        Route::delete('/{evento}/notas/{nota}', [AgendaController::class, 'eliminarNota']);

        Route::post  ('/{evento}/archivos',           [AgendaController::class, 'subirArchivo']);
        Route::delete('/{evento}/archivos/{archivo}', [AgendaController::class, 'eliminarArchivo']);
    });

    // ── Solo ADMIN ────────────────────────────────────────────────────────────
    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // Usuarios
        Route::get   ('/users',       fn() => \App\Models\User::select('id', 'name', 'email', 'role', 'created_at')->get());
        Route::delete('/users/{user}', function (\App\Models\User $user) {
            $user->delete();
            return response()->json(['message' => 'Usuario eliminado.']);
        });

        // Testimonios
        Route::get   ('/testimonios',                          [TestimonioController::class, 'adminIndex']);
        Route::patch ('/testimonios/{testimonio}/estado',      [TestimonioController::class, 'cambiarEstado']);
        Route::patch ('/testimonios/{testimonio}/destacar',    [TestimonioController::class, 'toggleDestacado']);
        Route::delete('/testimonios/{testimonio}',             [TestimonioController::class, 'adminEliminar']);

        // Anuncios
        Route::get   ('/anuncios',                       [AnuncioController::class, 'adminIndex']);
        Route::post  ('/anuncios',                       [AnuncioController::class, 'store']);
        Route::put   ('/anuncios/{anuncio}',             [AnuncioController::class, 'update']);
        Route::delete('/anuncios/{anuncio}',             [AnuncioController::class, 'destroy']);
        Route::patch ('/anuncios/{anuncio}/anclar',      [AnuncioController::class, 'toggleAnclado']);
        Route::post  ('/anuncios/{anuncio}/imagen',      [AnuncioController::class, 'subirImagen']);
        Route::delete('/anuncios/{anuncio}/imagen',      [AnuncioController::class, 'eliminarImagen']);
    });
});