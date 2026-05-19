<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use Carbon\Carbon;

class IngresoController extends Controller
{
    // ── Configuración ─────────────────────────────────────────────────────────

    // Ver configuración actual
    public function config(Request $request)
    {
        $config = $request->user()->ingresoConfig;
        return response()->json($config);
    }

// Guardar o actualizar configuración (no afecta meses pasados)
public function guardarConfig(Request $request)
{
    $data = $request->validate([
        'tipo'        => 'required|in:fijo,variable,mixto',
        'monto_base'  => 'nullable|numeric|min:0',
        'dia_pago'    => 'required|integer|min:0|max:31',
        'descripcion' => 'nullable|string|max:100',
        'moneda'      => 'nullable|string|size:3',
    ]);

    $config = IngresoConfig::updateOrCreate(
        ['user_id' => $request->user()->id],
        $data
    );

    return response()->json([
        'message' => 'Configuración guardada.',
        'config'  => $config,
    ]);
}
    // ── Ingresos ──────────────────────────────────────────────────────────────

    // Listar ingresos de un mes/año
    public function index(Request $request)
    {
        $mes  = $request->query('mes',  now()->month);
        $anio = $request->query('anio', now()->year);

        $ingresos = $request->user()->ingresos()
            ->where('mes', $mes)
            ->where('anio', $anio)
            ->orderBy('fecha')
            ->get();

        $total_confirmado  = $ingresos->where('confirmado', true)->sum('monto');
        $total_proyectado  = $ingresos->where('confirmado', false)->sum('monto');

        return response()->json([
            'ingresos'          => $ingresos,
            'total_confirmado'  => $total_confirmado,
            'total_proyectado'  => $total_proyectado,
        ]);
    }

    // Registrar ingreso manual (variable o extra)
    public function store(Request $request)
    {
        $data = $request->validate([
            'monto'       => 'required|numeric|min:0.01',
            'fecha'       => 'required|date',
            'descripcion' => 'nullable|string|max:150',
            'tipo'        => 'required|in:variable,extra',
            'confirmado'  => 'nullable|boolean',
        ]);

        $fecha  = Carbon::parse($data['fecha']);
        $user   = $request->user();
        $config = $user->ingresoConfig;

        $ingreso = Ingreso::create([
            ...$data,
            'user_id' => $user->id,
            'moneda'  => $config?->moneda ?? $user->currency ?? 'PEN',
            'mes'     => $fecha->month,
            'anio'    => $fecha->year,
            'confirmado' => $data['confirmado'] ?? true,
        ]);

        return response()->json([
            'message' => 'Ingreso registrado.',
            'ingreso' => $ingreso,
        ], 201);
    }

    // Confirmar ingreso proyectado (el dinero ya llegó)
    public function confirmar(Request $request, Ingreso $ingreso)
    {
        if ($ingreso->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $ingreso->update([
            'confirmado' => true,
            'fecha'      => $request->input('fecha', now()->toDateString()),
        ]);

        return response()->json(['message' => 'Ingreso confirmado.', 'ingreso' => $ingreso]);
    }

    // Editar ingreso (monto, fecha, descripción)
    public function update(Request $request, Ingreso $ingreso)
    {
        if ($ingreso->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'monto'       => 'nullable|numeric|min:0.01',
            'fecha'       => 'nullable|date',
            'descripcion' => 'nullable|string|max:150',
            'confirmado'  => 'nullable|boolean',
        ]);

        // No permite editar mes/año — protege historial
        $ingreso->update($data);

        return response()->json(['message' => 'Ingreso actualizado.', 'ingreso' => $ingreso]);
    }

    // Eliminar ingreso extra
    public function destroy(Request $request, Ingreso $ingreso)
    {
        if ($ingreso->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($ingreso->tipo === 'fijo') {
            return response()->json(['message' => 'No puedes eliminar un ingreso fijo proyectado.'], 422);
        }

        $ingreso->delete();
        return response()->json(['message' => 'Ingreso eliminado.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function proyectarIngresoFijoPublic($user, IngresoConfig $config): void
{
    $hoy  = now();
    $fecha = Carbon::create($hoy->year, $hoy->month, min($config->dia_pago, $hoy->daysInMonth));

    $existe = Ingreso::where('user_id', $user->id)
        ->where('tipo', 'fijo')
        ->where('mes', $hoy->month)
        ->where('anio', $hoy->year)
        ->exists();

    if (!$existe) {
        Ingreso::create([
            'user_id'     => $user->id,
            'monto'       => $config->monto_base,
            'moneda'      => $config->moneda,
            'fecha'       => $fecha->toDateString(),
            'descripcion' => $config->descripcion ?? 'Ingreso fijo mensual',
            'tipo'        => 'fijo',
            'confirmado'  => false,
            'mes'         => $hoy->month,
            'anio'        => $hoy->year,
        ]);
    }
}
}