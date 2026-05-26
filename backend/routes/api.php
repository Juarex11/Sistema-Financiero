<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TestimonioController;
use App\Http\Controllers\AnuncioController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\IngresoController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\EntradaController;
use App\Http\Controllers\GastoController;
use App\Http\Controllers\BilleteraTransaccionController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\MetaController;

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

    // Categorías de billetera
Route::get   ('/billetera/categorias',              [BilleteraTransaccionController::class, 'categorias']);
Route::post  ('/billetera/categorias',              [BilleteraTransaccionController::class, 'storeCategoria']);
Route::put   ('/billetera/categorias/{categoria}',  [BilleteraTransaccionController::class, 'updateCategoria']);
Route::delete('/billetera/categorias/{categoria}',  [BilleteraTransaccionController::class, 'destroyCategoria']);

// Transacciones
Route::get ('/billetera/transacciones', [BilleteraTransaccionController::class, 'index']);
Route::post('/billetera/transacciones', [BilleteraTransaccionController::class, 'store']);

Route::get('/reportes', [ReporteController::class, 'index']);

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
Route::get('/billetera/historial', [BilleteraTransaccionController::class, 'historial']);
Route::get   ('/metas',                    [MetaController::class, 'index']);
Route::post  ('/metas',                    [MetaController::class, 'store']);
Route::get   ('/metas/analisis',           [MetaController::class, 'analisis']);   // ← antes de {meta}
Route::get   ('/metas/{meta}',             [MetaController::class, 'show']);
Route::post  ('/metas/{meta}',             [MetaController::class, 'update']);     // POST por FormData
Route::delete('/metas/{meta}',             [MetaController::class, 'destroy']);
Route::post  ('/metas/{meta}/aportar',     [MetaController::class, 'aportar']);
Route::post  ('/metas/{meta}/retirar',     [MetaController::class, 'retirar']);
Route::patch ('/metas/{meta}/progreso',    [MetaController::class, 'actualizarProgreso']);
Route::patch ('/metas/{meta}/estado',      [MetaController::class, 'cambiarEstado']);
Route::get   ('/metas/{meta}/aportes',     [MetaController::class, 'aportes']);
 
    // Categorías de gastos
Route::get   ('/gastos/categorias',             [GastoController::class, 'categorias']);
Route::post  ('/gastos/categorias',             [GastoController::class, 'storeCategoria']);
Route::put   ('/gastos/categorias/{categoria}', [GastoController::class, 'updateCategoria']);
Route::delete('/gastos/categorias/{categoria}', [GastoController::class, 'destroyCategoria']);

// Gastos fijos
Route::get   ('/gastos',                  [GastoController::class, 'index']);
Route::post  ('/gastos',                  [GastoController::class, 'store']);
Route::put   ('/gastos/{gasto}',          [GastoController::class, 'update']);
Route::delete('/gastos/{gasto}',          [GastoController::class, 'destroy']);
Route::patch ('/gastos/{gasto}/toggle',   [GastoController::class, 'toggleActivo']);

// Movimientos
Route::get  ('/gastos/movimientos',                          [GastoController::class, 'movimientos']);
Route::get  ('/gastos/pendientes',                           [GastoController::class, 'pendientes']);
Route::patch('/gastos/movimientos/{movimiento}/confirmar',   [GastoController::class, 'confirmarPago']);
Route::patch('/gastos/movimientos/{movimiento}/eliminar',    [GastoController::class, 'eliminarPendiente']);

    // Billetera
Route::get('/billetera', [EntradaController::class, 'billetera']);
Route::get('/billetera/movimientos', [EntradaController::class, 'movimientos']);

// Categorías
Route::get   ('/entradas/categorias',              [EntradaController::class, 'categorias']);
Route::post  ('/entradas/categorias',              [EntradaController::class, 'storeCategoria']);
Route::put   ('/entradas/categorias/{categoria}',  [EntradaController::class, 'updateCategoria']);
Route::delete('/entradas/categorias/{categoria}',  [EntradaController::class, 'destroyCategoria']);

// Entradas fijas
Route::get   ('/entradas',                  [EntradaController::class, 'index']);
Route::post  ('/entradas',                  [EntradaController::class, 'store']);
Route::put   ('/entradas/{entrada}',        [EntradaController::class, 'update']);
Route::delete('/entradas/{entrada}',        [EntradaController::class, 'destroy']);
Route::patch ('/entradas/{entrada}/toggle', [EntradaController::class, 'toggleActivo']);

    Route::get   ('/tickets',                        [TicketController::class, 'index']);
Route::post  ('/tickets',                        [TicketController::class, 'store']);
Route::get   ('/tickets/{ticket}',               [TicketController::class, 'show']);
Route::post  ('/tickets/{ticket}/responder',     [TicketController::class, 'responder']);

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

         Route::get   ('/tickets',                        [TicketController::class, 'adminIndex']);
    Route::get   ('/tickets/{ticket}',               [TicketController::class, 'adminShow']);
    Route::post  ('/tickets/{ticket}/responder',     [TicketController::class, 'adminResponder']);
    Route::patch ('/tickets/{ticket}/estado',        [TicketController::class, 'cambiarEstado']);
    });
});