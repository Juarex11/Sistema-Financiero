<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Meta;
use App\Models\MetaAporte;
use App\Models\Billetera;
use Carbon\Carbon;

class MetaController extends Controller
{
    // ── Listar ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $metas = Meta::where('user_id', $request->user()->id)
            ->withCount('aportes')
            ->orderByRaw("FIELD(estado, 'activa', 'pausada', 'completada')")
            ->orderBy('fecha_limite')
            ->get()
            ->map(fn($m) => $this->conImagenUrl($m));

        return response()->json($metas);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'             => 'required|string|max:100',
            'descripcion'        => 'nullable|string|max:255',
            'color'              => 'nullable|string|max:7',
            'icono'              => 'nullable|string|max:40',
            'tipo_medicion'      => 'required|in:monto,porcentaje',
            'monto_objetivo'     => 'nullable|numeric|min:0.01|required_if:tipo_medicion,monto',
            'moneda'             => 'nullable|string|size:3',
            'fecha_limite'       => 'nullable|date',
            'tipo_recordatorio'  => 'nullable|in:fecha,periodico,ambos',
            'recordatorio_fecha' => 'nullable|date',
            'recordatorio_dia'   => 'nullable|integer|min:1|max:31',
            'imagen'             => 'nullable|image|max:4096',
        ]);

        $user = $request->user();
        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('metas', 'public');
        }

        $meta = Meta::create([
            ...$data,
            'user_id'        => $user->id,
            'moneda'         => $data['moneda'] ?? $user->currency ?? 'PEN',
            'color'          => $data['color']  ?? '#9333ea',
            'icono'          => $data['icono']  ?? 'Target',
            'monto_aportado' => 0,
            'porcentaje_actual' => 0,
            'estado'         => 'activa',
        ]);

        return response()->json([
            'message' => 'Meta creada.',
            'meta'    => $this->conImagenUrl($meta),
        ], 201);
    }

    // ── Ver ───────────────────────────────────────────────────────────────────

    public function show(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);
        $meta->load('aportes');
        return response()->json($this->conImagenUrl($meta));
    }

    // ── Editar (POST por FormData con imagen) ─────────────────────────────────

    public function update(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'nombre'             => 'nullable|string|max:100',
            'descripcion'        => 'nullable|string|max:255',
            'color'              => 'nullable|string|max:7',
            'icono'              => 'nullable|string|max:40',
            'monto_objetivo'     => 'nullable|numeric|min:0.01',
            'moneda'             => 'nullable|string|size:3',
            'fecha_limite'       => 'nullable|date',
            'tipo_recordatorio'  => 'nullable|in:fecha,periodico,ambos',
            'recordatorio_fecha' => 'nullable|date',
            'recordatorio_dia'   => 'nullable|integer|min:1|max:31',
            'imagen'             => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('imagen')) {
            if ($meta->imagen) Storage::disk('public')->delete($meta->imagen);
            $data['imagen'] = $request->file('imagen')->store('metas', 'public');
        }

        $meta->update($data);
        $this->verificarCompletada($meta);

        return response()->json([
            'message' => 'Meta actualizada.',
            'meta'    => $this->conImagenUrl($meta->fresh()),
        ]);
    }

    // ── Eliminar → devuelve aportes a billetera ───────────────────────────────

    public function destroy(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);

        DB::transaction(function () use ($meta, $request) {
            // Devolver monto aportado a billetera si hay algo
            if ($meta->tipo_medicion === 'monto' && $meta->monto_aportado > 0) {
                $billetera = $request->user()->billetera;
                if ($billetera) {
                    $billetera->increment('saldo', $meta->monto_aportado);
                }
            }

            if ($meta->imagen) Storage::disk('public')->delete($meta->imagen);
            $meta->delete(); // cascade elimina meta_aportes
        });

        return response()->json(['message' => 'Meta eliminada. El saldo aportado fue devuelto a tu billetera.']);
    }

    // ── Aportar → descuenta billetera ─────────────────────────────────────────

    public function aportar(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);
        abort_if($meta->estado === 'completada', 422, 'La meta ya está completada.');
        abort_if($meta->tipo_medicion !== 'monto', 422, 'Solo metas de tipo monto aceptan aportes.');

        $data = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'nota'  => 'nullable|string|max:255',
        ]);

        $user      = $request->user();
        $billetera = $user->billetera;

        if (!$billetera) {
            return response()->json(['message' => 'No tienes billetera registrada.'], 422);
        }

        if ((float) $billetera->saldo < (float) $data['monto']) {
            return response()->json(['message' => 'Saldo insuficiente en tu billetera.'], 422);
        }

        DB::transaction(function () use ($data, $user, $meta, $billetera) {
            // 1. Crear aporte
            MetaAporte::create([
                'meta_id'      => $meta->id,
                'user_id'      => $user->id,
                'billetera_id' => $billetera->id,
                'monto'        => $data['monto'],
                'moneda'       => $meta->moneda,
                'nota'         => $data['nota'] ?? null,
                'fecha'        => now()->toDateString(),
            ]);

            // 2. Sumar a monto_aportado de la meta
            $meta->increment('monto_aportado', $data['monto']);

            // 3. Descontar de billetera
            $billetera->decrement('saldo', $data['monto']);
        });

        $meta->refresh();
        $this->verificarCompletada($meta);

        return response()->json([
            'message'   => 'Aporte registrado.',
            'meta'      => $this->conImagenUrl($meta->fresh()),
            'saldo'     => (float) $billetera->fresh()->saldo,
        ]);
    }

    // ── Retirar aporte → devuelve a billetera ────────────────────────────────

    public function retirar(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);
        abort_if($meta->tipo_medicion !== 'monto', 422, 'Solo metas de tipo monto.');

        $data = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'nota'  => 'nullable|string|max:255',
        ]);

        if ((float) $data['monto'] > (float) $meta->monto_aportado) {
            return response()->json(['message' => 'No puedes retirar más de lo aportado.'], 422);
        }

        $billetera = $request->user()->billetera;

        DB::transaction(function () use ($data, $request, $meta, $billetera) {
            // Aporte negativo para registrar el retiro en historial
            MetaAporte::create([
                'meta_id'      => $meta->id,
                'user_id'      => $request->user()->id,
                'billetera_id' => $billetera->id,
                'monto'        => -abs($data['monto']),
                'moneda'       => $meta->moneda,
                'nota'         => $data['nota'] ?? 'Retiro de meta',
                'fecha'        => now()->toDateString(),
            ]);

            $meta->decrement('monto_aportado', abs($data['monto']));
            $billetera->increment('saldo', abs($data['monto']));
        });

        $meta->refresh();

        // Si estaba completada y retiró, volver a activa
        if ($meta->estado === 'completada' && $meta->progreso < 100) {
            $meta->update(['estado' => 'activa']);
        }

        return response()->json([
            'message' => 'Retiro registrado. El saldo fue devuelto a tu billetera.',
            'meta'    => $this->conImagenUrl($meta->fresh()),
            'saldo'   => (float) $billetera->fresh()->saldo,
        ]);
    }

    // ── Actualizar progreso (tipo porcentaje) ─────────────────────────────────

    public function actualizarProgreso(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);
        abort_if($meta->tipo_medicion !== 'porcentaje', 422, 'Solo para metas de tipo porcentaje.');

        $data = $request->validate([
            'porcentaje_actual' => 'required|integer|min:0|max:100',
        ]);

        $meta->update(['porcentaje_actual' => $data['porcentaje_actual']]);
        $this->verificarCompletada($meta);

        return response()->json([
            'message' => 'Progreso actualizado.',
            'meta'    => $this->conImagenUrl($meta->fresh()),
        ]);
    }

    // ── Cambiar estado ────────────────────────────────────────────────────────

    public function cambiarEstado(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'estado' => 'required|in:activa,pausada,completada',
        ]);

        $meta->update(['estado' => $data['estado']]);

        return response()->json(['message' => 'Estado actualizado.', 'meta' => $this->conImagenUrl($meta)]);
    }

    // ── Historial de aportes ──────────────────────────────────────────────────

    public function aportes(Request $request, Meta $meta)
    {
        abort_if($meta->user_id !== $request->user()->id, 403);

        $aportes = $meta->aportes()
            ->orderByDesc('fecha')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($aportes);
    }

    // ── Análisis: sugerencia + progreso automático ────────────────────────────

    public function analisis(Request $request)
    {
        $user      = $request->user();
        $moneda    = $user->currency ?? 'PEN';
        $billetera = $user->billetera;
        $saldo     = $billetera ? (float) $billetera->saldo : 0;

        // Últimos 3 meses con datos
        $meses = 3;
        $desde = now()->subMonths($meses)->startOfMonth()->toDateString();
        $hasta = now()->endOfMonth()->toDateString();

        // Ingresos confirmados
        $totalIngresos = \App\Models\Ingreso::where('user_id', $user->id)
            ->where('confirmado', true)
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        // Entradas fijas
        $totalEntradas = \App\Models\BilleteraMovimiento::where('user_id', $user->id)
            ->where('tipo', 'entrada')
            ->whereNotNull('entrada_id')
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        // Gastos (pagados + pendientes)
        $totalGastosFijos = \App\Models\GastoMovimiento::where('user_id', $user->id)
            ->whereIn('estado', ['pagado', 'pendiente'])
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        // Egresos manuales billetera
        $totalEgresosBilletera = \App\Models\BilleteraTransaccion::where('user_id', $user->id)
            ->where('tipo', 'egreso')
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        // Ingresos manuales billetera
        $totalIngresosBilletera = \App\Models\BilleteraTransaccion::where('user_id', $user->id)
            ->where('tipo', 'ingreso')
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        $ingresoTotal = ((float)$totalIngresos + (float)$totalEntradas + (float)$totalIngresosBilletera) / $meses;
        $egresoTotal  = ((float)$totalGastosFijos + (float)$totalEgresosBilletera) / $meses;
        $ahorroMensual = max(0, round($ingresoTotal - $egresoTotal, 2));

        // Metas activas con su proyección
        $metas = Meta::where('user_id', $user->id)
            ->where('estado', 'activa')
            ->where('tipo_medicion', 'monto')
            ->get()
            ->map(function ($meta) use ($ahorroMensual, $saldo) {
                $restante = max(0, (float)$meta->monto_objetivo - (float)$meta->monto_aportado);

                $mesesNecesarios = null;
                $fechaEstimada   = null;

                if ($ahorroMensual > 0 && $restante > 0) {
                    $mesesNecesarios = (int) ceil($restante / $ahorroMensual);
                    $fechaEstimada   = now()->addMonths($mesesNecesarios)->format('M Y');
                } elseif ($restante === 0.0) {
                    $mesesNecesarios = 0;
                    $fechaEstimada   = 'Ya alcanzada';
                }

                // ¿El saldo actual cubre la meta completa?
                $saldoCubre = $saldo >= (float)$meta->monto_objetivo;

                // ¿Subió el saldo respecto al aporte anterior?
                $ultimoAporte = $meta->aportes()->orderByDesc('created_at')->first();
                $saldoSubio   = $ahorroMensual > 0;

                return [
                    'meta_id'          => $meta->id,
                    'nombre'           => $meta->nombre,
                    'color'            => $meta->color,
                    'monto_objetivo'   => $meta->monto_objetivo,
                    'monto_aportado'   => $meta->monto_aportado,
                    'restante'         => round($restante, 2),
                    'progreso'         => $meta->progreso,
                    'meses_necesarios' => $mesesNecesarios,
                    'fecha_estimada'   => $fechaEstimada,
                    'saldo_cubre'      => $saldoCubre,
                    'sugerencia_aporte'=> $ahorroMensual > 0
                        ? round(min($ahorroMensual * 0.3, $restante), 2) // sugerir 30% del ahorro
                        : null,
                ];
            });

        return response()->json([
            'ahorro_mensual_promedio' => $ahorroMensual,
            'saldo_actual'            => $saldo,
            'moneda'                  => $moneda,
            'meses_analizados'        => $meses,
            'proyecciones'            => $metas,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function verificarCompletada(Meta $meta): void
    {
        if ($meta->estado === 'completada') return;

        $completada = $meta->tipo_medicion === 'monto'
            ? ($meta->monto_objetivo > 0 && $meta->monto_aportado >= $meta->monto_objetivo)
            : ($meta->porcentaje_actual >= 100);

        if ($completada) $meta->update(['estado' => 'completada']);
    }

    private function conImagenUrl(Meta $meta): Meta
    {
        $meta->imagen_url = $meta->imagen
            ? \Illuminate\Support\Facades\Storage::disk('public')->url($meta->imagen)
            : null;
        return $meta;
    }
}