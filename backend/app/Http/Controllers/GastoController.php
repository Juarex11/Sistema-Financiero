<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Gasto;
use App\Models\GastoCategoria;
use App\Models\GastoMovimiento;
use App\Models\Billetera;
use Carbon\Carbon;

class GastoController extends Controller
{
    // ── Helper billetera ──────────────────────────────────────────────────────

    private function restarDeBilletera($user, $monto, $moneda, $descripcion, $fecha, $gastoId = null): GastoMovimiento
    {
        $billetera = $user->billetera ?? Billetera::create([
            'user_id' => $user->id,
            'saldo'   => 0,
            'moneda'  => $moneda,
        ]);

        $fechaCarbon = Carbon::parse($fecha);

        $movimiento = null;

        DB::transaction(function () use (
            $billetera, $user, $monto, $moneda,
            $descripcion, $fechaCarbon, $gastoId, &$movimiento
        ) {
            $movimiento = GastoMovimiento::create([
                'user_id'      => $user->id,
                'billetera_id' => $billetera->id,
                'gasto_id'     => $gastoId,
                'monto'        => $monto,
                'moneda'       => $moneda,
                'tipo'         => 'salida',
                'estado'       => 'pagado',
                'descripcion'  => $descripcion,
                'fecha'        => $fechaCarbon->toDateString(),
                'hora'         => null,
                'mes'          => $fechaCarbon->month,
                'anio'         => $fechaCarbon->year,
            ]);

            $billetera->restar((float) $monto);
        });

        return $movimiento;
    }

    // ── Categorías ────────────────────────────────────────────────────────────

    public function categorias(Request $request)
    {
        return response()->json(
            $request->user()->gastoCategorias()->withCount('gastos')->get()
        );
    }

    public function storeCategoria(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:80',
            'color'  => 'nullable|string|max:7',
            'icono'  => 'nullable|string|max:40',
        ]);

        $cat = GastoCategoria::create([
            ...$data,
            'user_id' => $request->user()->id,
            'color'   => $data['color'] ?? '#ef4444',
            'icono'   => $data['icono'] ?? 'Receipt',
        ]);

        return response()->json(['message' => 'Categoría creada.', 'categoria' => $cat], 201);
    }

    public function updateCategoria(Request $request, GastoCategoria $categoria)
    {
        if ($categoria->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'nombre' => 'nullable|string|max:80',
            'color'  => 'nullable|string|max:7',
            'icono'  => 'nullable|string|max:40',
        ]);

        $categoria->update($data);
        return response()->json(['message' => 'Categoría actualizada.', 'categoria' => $categoria]);
    }

    public function destroyCategoria(Request $request, GastoCategoria $categoria)
    {
        if ($categoria->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada.']);
    }

    // ── Gastos ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $gastos = $request->user()->gastos()
            ->with('categoria')
            ->orderBy('configurado')
            ->orderBy('dia_pago')
            ->get();

        return response()->json($gastos);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:100',
            'descripcion'   => 'nullable|string|max:255',
            'monto'         => 'nullable|numeric|min:0.01',
            'moneda'        => 'nullable|string|size:3',
            'dia_pago'      => 'nullable|integer|min:1|max:31',
            'hora_pago'     => 'nullable|date_format:H:i',
            'tipo_registro' => 'nullable|in:automatico,manual',
            'inicio_desde'  => 'nullable|in:actual,proximo',
            'categoria_id'  => 'nullable|exists:gasto_categorias,id',
            'imagen'        => 'nullable|image|max:4096',
        ]);

        $user      = $request->user();
        $imagePath = null;

        if ($request->hasFile('imagen')) {
            $imagePath = $request->file('imagen')->store('gastos', 'public');
        }

        $configurado = !empty($data['monto']) && !empty($data['dia_pago']);

        $gasto = Gasto::create([
            ...$data,
            'user_id'     => $user->id,
            'moneda'      => $data['moneda'] ?? $user->currency ?? 'PEN',
            'imagen'      => $imagePath,
            'activo'      => true,
            'configurado' => $configurado,
            'inicio_desde' => $data['inicio_desde'] ?? 'proximo',
            'tipo_registro' => $data['tipo_registro'] ?? 'manual',
        ]);

        // Si configurado + actual + automatico → crear movimiento pendiente este mes
       if (
    $configurado &&
    ($data['inicio_desde'] ?? 'proximo') === 'actual'
) {
            $this->crearMovimientoPendiente($user, $gasto, now());
        }

        return response()->json([
            'message' => 'Gasto creado.',
            'gasto'   => $gasto->load('categoria'),
        ], 201);
    }

 public function update(Request $request, Gasto $gasto)
{
    if ($gasto->user_id !== $request->user()->id) {
        return response()->json(['message' => 'No autorizado.'], 403);
    }

    $data = $request->validate([
        'nombre'        => 'nullable|string|max:100',
        'descripcion'   => 'nullable|string|max:255',
        'monto'         => 'nullable|numeric|min:0.01',
        'dia_pago'      => 'nullable|integer|min:1|max:31',
        'hora_pago'     => 'nullable|date_format:H:i',
        'tipo_registro' => 'nullable|in:automatico,manual',
        'categoria_id'  => 'nullable|exists:gasto_categorias,id',
        'activo'        => 'nullable|boolean',
    ]);

    if ($request->hasFile('imagen')) {
        if ($gasto->imagen) Storage::disk('public')->delete($gasto->imagen);
        $data['imagen'] = $request->file('imagen')->store('gastos', 'public');
    }

    $data['configurado'] = !empty($data['monto'] ?? $gasto->monto)
        && !empty($data['dia_pago'] ?? $gasto->dia_pago);

    $gasto->update($data);

    // Crear movimiento si el día de pago ya llegó este mes y no existe aún
    if ($gasto->configurado && $gasto->activo) {
        $hoy     = now();
        $diaPago = (int) ($data['dia_pago'] ?? $gasto->dia_pago);

        if ($diaPago <= $hoy->day) {
            $this->crearMovimientoPendiente($request->user(), $gasto, $hoy);
        }
    }

    return response()->json([
        'message' => 'Gasto actualizado.',
        'gasto'   => $gasto->load('categoria'),
    ]);
}
    public function destroy(Request $request, Gasto $gasto)
    {
        if ($gasto->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($gasto->imagen) Storage::disk('public')->delete($gasto->imagen);
        $gasto->delete();
        return response()->json(['message' => 'Gasto eliminado.']);
    }

    public function toggleActivo(Request $request, Gasto $gasto)
    {
        if ($gasto->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $gasto->update(['activo' => !$gasto->activo]);
        return response()->json([
            'message' => $gasto->activo ? 'Gasto activado.' : 'Gasto pausado.',
            'gasto'   => $gasto,
        ]);
    }

    // ── Movimientos ───────────────────────────────────────────────────────────

    public function movimientos(Request $request)
    {
        $anio = $request->query('anio', now()->year);

        $movimientos = GastoMovimiento::where('user_id', $request->user()->id)
            ->where('anio', $anio)
            ->where('estado', 'pagado')
            ->with('gasto.categoria')
            ->orderBy('mes')
            ->orderByDesc('fecha')
            ->get()
            ->groupBy('mes');

        return response()->json($movimientos);
    }

    // Movimientos pendientes del mes actual (para alertas manuales)
    public function pendientes(Request $request)
    {
        $hoy = now();

        $pendientes = GastoMovimiento::where('user_id', $request->user()->id)
            ->where('mes', $hoy->month)
            ->where('anio', $hoy->year)
            ->where('estado', 'pendiente')
            ->with('gasto.categoria')
            ->get();

        return response()->json($pendientes);
    }

    // Usuario confirma que pagó (manual)
    public function confirmarPago(Request $request, GastoMovimiento $movimiento)
    {
        if ($movimiento->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($movimiento->estado !== 'pendiente') {
            return response()->json(['message' => 'Este movimiento ya fue procesado.'], 422);
        }

        $fecha = $request->input('fecha', now()->toDateString());

        DB::transaction(function () use ($movimiento, $fecha) {
            $movimiento->update(['estado' => 'pagado', 'fecha' => $fecha]);
            $movimiento->billetera->restar((float) $movimiento->monto);
        });

        return response()->json(['message' => 'Pago confirmado.', 'movimiento' => $movimiento]);
    }

    // Usuario elimina el gasto pendiente (no lo pagó / no aplica)
    public function eliminarPendiente(Request $request, GastoMovimiento $movimiento)
    {
        if ($movimiento->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $movimiento->update(['estado' => 'eliminado']);
        return response()->json(['message' => 'Gasto pendiente eliminado.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

public function crearMovimientoPendiente($user, Gasto $gasto, Carbon $fecha): void
{
    $billetera = $user->billetera ?? Billetera::create([
        'user_id' => $user->id,
        'saldo'   => 0,
        'moneda'  => $gasto->moneda,
    ]);
 
    $existe = GastoMovimiento::where('user_id', $user->id)
        ->where('gasto_id', $gasto->id)
        ->where('mes', $fecha->month)
        ->where('anio', $fecha->year)
        ->exists();
 
    if ($existe) return;
 
    // ✅ Automático → pagado y descuenta billetera de inmediato
    // ✅ Manual     → pendiente, espera confirmación del usuario
    $esAutomatico = $gasto->tipo_registro === 'automatico';
    $estado       = $esAutomatico ? 'pagado' : 'pendiente';
 
    DB::transaction(function () use (
        $user, $billetera, $gasto, $fecha, $estado, $esAutomatico
    ) {
        GastoMovimiento::create([
            'user_id'      => $user->id,
            'billetera_id' => $billetera->id,
            'gasto_id'     => $gasto->id,
            'monto'        => $gasto->monto,
            'moneda'       => $gasto->moneda,
            'tipo'         => 'salida',
            'estado'       => $estado,
            'descripcion'  => $gasto->nombre,
            'fecha'        => $fecha->toDateString(),
            'hora'         => $gasto->hora_pago,
            'mes'          => $fecha->month,
            'anio'         => $fecha->year,
        ]);
 
        // Solo descontar si es automático
        if ($esAutomatico) {
            $billetera->restar((float) $gasto->monto);
        }
    });
}
}