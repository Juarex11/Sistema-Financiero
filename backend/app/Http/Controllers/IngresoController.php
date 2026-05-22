<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use App\Models\Billetera;
use App\Models\BilleteraMovimiento;
use Carbon\Carbon;

class IngresoController extends Controller
{
    // ── Helper billetera ──────────────────────────────────────────────────────

    private function sumarABilletera($user, $monto, $moneda, $descripcion, $fecha): void
    {
        $billetera = $user->billetera ?? Billetera::create([
            'user_id' => $user->id,
            'saldo'   => 0,
            'moneda'  => $moneda,
        ]);

        DB::transaction(function () use ($billetera, $user, $monto, $moneda, $descripcion, $fecha) {
            $fechaCarbon = Carbon::parse($fecha);
            BilleteraMovimiento::create([
                'user_id'      => $user->id,
                'billetera_id' => $billetera->id,
                'entrada_id'   => null,
                'monto'        => $monto,
                'moneda'       => $moneda,
                'tipo'         => 'entrada',
                'descripcion'  => $descripcion,
                'fecha'        => $fechaCarbon->toDateString(),
                'hora'         => null,
                'mes'          => $fechaCarbon->month,
                'anio'         => $fechaCarbon->year,
            ]);
            $billetera->sumar((float) $monto);
        });
    }

    // ── Configuración ─────────────────────────────────────────────────────────

    public function config(Request $request)
    {
        $config = $request->user()->ingresoConfig;
        return response()->json($config);
    }

    public function guardarConfig(Request $request)
    {
        $data = $request->validate([
            'tipo'        => 'required|in:fijo,variable',
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

    public function index(Request $request)
    {
        $mes  = $request->query('mes',  now()->month);
        $anio = $request->query('anio', now()->year);

        $ingresos = $request->user()->ingresos()
            ->where('mes', $mes)
            ->where('anio', $anio)
            ->orderBy('fecha')
            ->get();

        $total_confirmado = $ingresos->where('confirmado', true)->sum('monto');
        $total_proyectado = $ingresos->where('confirmado', false)->sum('monto');

        return response()->json([
            'ingresos'         => $ingresos,
            'total_confirmado' => $total_confirmado,
            'total_proyectado' => $total_proyectado,
        ]);
    }

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
        $confirmado = $data['confirmado'] ?? true;

        $ingreso = Ingreso::create([
            ...$data,
            'user_id'    => $user->id,
            'moneda'     => $config?->moneda ?? $user->currency ?? 'PEN',
            'mes'        => $fecha->month,
            'anio'       => $fecha->year,
            'confirmado' => $confirmado,
        ]);

        // Si se crea ya confirmado → sumar a billetera
        if ($confirmado) {
            $this->sumarABilletera(
                $user,
                $ingreso->monto,
                $ingreso->moneda,
                $ingreso->descripcion ?? 'Ingreso mensual',
                $ingreso->fecha
            );
        }

        return response()->json([
            'message' => 'Ingreso registrado.',
            'ingreso' => $ingreso,
        ], 201);
    }

    public function confirmar(Request $request, Ingreso $ingreso)
    {
        if ($ingreso->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // Evitar doble suma si ya estaba confirmado
        if ($ingreso->confirmado) {
            return response()->json(['message' => 'Ya estaba confirmado.', 'ingreso' => $ingreso]);
        }

        $fecha = $request->input('fecha', now()->toDateString());

        $ingreso->update([
            'confirmado' => true,
            'fecha'      => $fecha,
        ]);

        // Sumar a billetera
        $this->sumarABilletera(
            $request->user(),
            $ingreso->monto,
            $ingreso->moneda,
            $ingreso->descripcion ?? 'Ingreso mensual',
            $fecha
        );

        return response()->json(['message' => 'Ingreso confirmado.', 'ingreso' => $ingreso]);
    }

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

        $ingreso->update($data);

        return response()->json(['message' => 'Ingreso actualizado.', 'ingreso' => $ingreso]);
    }

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
        $hoy   = now();
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