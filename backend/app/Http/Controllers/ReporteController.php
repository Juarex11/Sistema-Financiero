<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GastoMovimiento;
use App\Models\Ingreso;
use App\Models\BilleteraTransaccion;
use App\Models\BilleteraMovimiento;   // ← NUEVO
use Carbon\Carbon;

class ReporteController extends Controller
{
    private function fechaStr($fecha): string
    {
        if ($fecha instanceof \Carbon\Carbon) return $fecha->toDateString();
        if ($fecha instanceof \Illuminate\Support\Carbon) return $fecha->toDateString();
        return substr((string) $fecha, 0, 10);
    }

    public function index(Request $request)
    {
        $user    = $request->user();
        $periodo = $request->query('periodo', 'mes');
        $hoy     = Carbon::today();

        switch ($periodo) {
            case 'dia':
                $fecha = $request->query('fecha', $hoy->toDateString());
                $desde = Carbon::parse($fecha)->startOfDay();
                $hasta = Carbon::parse($fecha)->endOfDay();
                break;
            case 'semana':
                $inicioSemana = $request->query('semana', $hoy->copy()->startOfWeek(Carbon::MONDAY)->toDateString());
                $desde = Carbon::parse($inicioSemana)->startOfDay();
                $hasta = $desde->copy()->addDays(6)->endOfDay();
                break;
            case 'anio':
                $anio  = (int) $request->query('anio', $hoy->year);
                $desde = Carbon::create($anio, 1, 1)->startOfDay();
                $hasta = Carbon::create($anio, 12, 31)->endOfDay();
                break;
            case 'rango':
                $desde = Carbon::parse($request->query('desde', $hoy->toDateString()))->startOfDay();
                $hasta = Carbon::parse($request->query('hasta', $hoy->toDateString()))->endOfDay();
                break;
            default: // mes
                $mes   = (int) $request->query('mes',  $hoy->month);
                $anio  = (int) $request->query('anio', $hoy->year);
                $desde = Carbon::create($anio, $mes, 1)->startOfDay();
                $hasta = $desde->copy()->endOfMonth()->endOfDay();
                break;
        }

        $desdeStr = $desde->toDateString();
        $hastaStr = $hasta->toDateString();

        // ── 1. GASTOS ─────────────────────────────────────────────────────────
        // Incluir 'pagado' Y 'pendiente' — los manuales no confirmados
        // también representan un gasto real del periodo
        $gastoMovimientos = GastoMovimiento::where('user_id', $user->id)
            ->whereIn('estado', ['pagado', 'pendiente'])
            ->whereBetween('fecha', [$desdeStr, $hastaStr])
            ->with('gasto.categoria')
            ->orderBy('fecha')
            ->get();

        $egresosBilletera = BilleteraTransaccion::where('user_id', $user->id)
            ->where('tipo', 'egreso')
            ->whereBetween('fecha', [$desdeStr, $hastaStr])
            ->with('categoria')
            ->orderBy('fecha')
            ->get();

        $gastosPorCategoria = [];

        // Gastos fijos → agrupar por NOMBRE DEL GASTO (no por categoría)
        foreach ($gastoMovimientos as $m) {
            $nombreGasto = $m->gasto?->nombre ?? $m->descripcion ?? 'Gasto fijo';
            $cat         = $m->gasto?->categoria;
            $key         = 'gasto_' . ($m->gasto_id ?? md5($nombreGasto));
            $color       = $cat ? ($cat->color ?? '#ef4444') : '#ef4444';

            if (!isset($gastosPorCategoria[$key])) {
                $gastosPorCategoria[$key] = ['id' => $key, 'nombre' => $nombreGasto, 'color' => $color, 'monto' => 0];
            }
            $gastosPorCategoria[$key]['monto'] += (float) $m->monto;
        }

        // Egresos manuales de billetera → agrupar por CATEGORÍA de la transacción
        foreach ($egresosBilletera as $t) {
            $cat    = $t->categoria;
            $key    = $cat ? 'bcat_' . $cat->id : 'sin_cat_egr';
            $nombre = $cat ? $cat->nombre : ($t->descripcion ?? 'Sin categoría');
            $color  = $cat ? ($cat->color ?? '#94a3b8') : '#94a3b8';

            if (!isset($gastosPorCategoria[$key])) {
                $gastosPorCategoria[$key] = ['id' => $key, 'nombre' => $nombre, 'color' => $color, 'monto' => 0];
            }
            $gastosPorCategoria[$key]['monto'] += (float) $t->monto;
        }

        $totalGastos = array_sum(array_column($gastosPorCategoria, 'monto'));

        $gastosPorCategoria = array_map(function ($cat) use ($totalGastos) {
            $cat['porcentaje'] = $totalGastos > 0 ? round(($cat['monto'] / $totalGastos) * 100, 1) : 0;
            return $cat;
        }, array_values($gastosPorCategoria));

        usort($gastosPorCategoria, fn($a, $b) => $b['monto'] <=> $a['monto']);

        $serieGastos = [];
        foreach ($gastoMovimientos as $m) {
            $d = $this->fechaStr($m->fecha);
            $serieGastos[$d] = ($serieGastos[$d] ?? 0) + (float) $m->monto;
        }
        foreach ($egresosBilletera as $t) {
            $d = $this->fechaStr($t->fecha);
            $serieGastos[$d] = ($serieGastos[$d] ?? 0) + (float) $t->monto;
        }

        // ── 2. INGRESOS ───────────────────────────────────────────────────────
        $ingresosMod = Ingreso::where('user_id', $user->id)
            ->where('confirmado', true)
            ->whereBetween('fecha', [$desdeStr, $hastaStr])
            ->orderBy('fecha')
            ->get();

        $ingresosBilletera = BilleteraTransaccion::where('user_id', $user->id)
            ->where('tipo', 'ingreso')
            ->whereBetween('fecha', [$desdeStr, $hastaStr])
            ->with('categoria')
            ->orderBy('fecha')
            ->get();

        // ── NUEVO: Entradas fijas registradas automáticamente ─────────────────
        $entradasFijas = BilleteraMovimiento::where('user_id', $user->id)
            ->where('tipo', 'entrada')
            ->whereNotNull('entrada_id')
            ->whereBetween('fecha', [$desdeStr, $hastaStr])
            ->with('entrada.categoria')
            ->orderBy('fecha')
            ->get();

        $ingresosPorCategoria = [];

        // Ingresos manuales confirmados
        foreach ($ingresosMod as $i) {
            $key    = 'tipo_' . ($i->tipo ?? 'otro');
            $nombre = $i->descripcion ?? ucfirst($i->tipo ?? 'Ingreso');

            if (!isset($ingresosPorCategoria[$key])) {
                $ingresosPorCategoria[$key] = ['id' => $key, 'nombre' => $nombre, 'color' => '#10b981', 'monto' => 0];
            }
            $ingresosPorCategoria[$key]['monto'] += (float) $i->monto;
        }

        // Ingresos manuales de billetera (transacciones tipo ingreso)
        foreach ($ingresosBilletera as $t) {
            $cat    = $t->categoria;
            $key    = $cat ? 'bcat_' . $cat->id : 'sin_cat_ing';
            $nombre = $cat ? $cat->nombre : 'Sin categorizar';
            $color  = $cat ? ($cat->color ?? '#3b82f6') : '#94a3b8';

            if (!isset($ingresosPorCategoria[$key])) {
                $ingresosPorCategoria[$key] = ['id' => $key, 'nombre' => $nombre, 'color' => $color, 'monto' => 0];
            }
            $ingresosPorCategoria[$key]['monto'] += (float) $t->monto;
        }

        // ── NUEVO: Entradas fijas → agrupadas por su categoría de entrada ─────
        foreach ($entradasFijas as $m) {
            $cat    = $m->entrada?->categoria;
            $key    = $cat ? 'ecat_' . $cat->id : 'entrada_' . ($m->entrada_id ?? 'otra');
            $nombre = $cat ? $cat->nombre : ($m->entrada?->nombre ?? $m->descripcion ?? 'Entrada fija');
            $color  = $cat ? ($cat->color ?? '#9333ea') : '#9333ea';

            if (!isset($ingresosPorCategoria[$key])) {
                $ingresosPorCategoria[$key] = ['id' => $key, 'nombre' => $nombre, 'color' => $color, 'monto' => 0];
            }
            $ingresosPorCategoria[$key]['monto'] += (float) $m->monto;
        }

        $totalIngresos = array_sum(array_column($ingresosPorCategoria, 'monto'));

        $ingresosPorCategoria = array_map(function ($cat) use ($totalIngresos) {
            $cat['porcentaje'] = $totalIngresos > 0 ? round(($cat['monto'] / $totalIngresos) * 100, 1) : 0;
            return $cat;
        }, array_values($ingresosPorCategoria));

        usort($ingresosPorCategoria, fn($a, $b) => $b['monto'] <=> $a['monto']);

        $serieIngresos = [];
        foreach ($ingresosMod as $i) {
            $d = $this->fechaStr($i->fecha);
            $serieIngresos[$d] = ($serieIngresos[$d] ?? 0) + (float) $i->monto;
        }
        foreach ($ingresosBilletera as $t) {
            $d = $this->fechaStr($t->fecha);
            $serieIngresos[$d] = ($serieIngresos[$d] ?? 0) + (float) $t->monto;
        }
        // ── NUEVO: sumar entradas fijas a la serie temporal ───────────────────
        foreach ($entradasFijas as $m) {
            $d = $this->fechaStr($m->fecha);
            $serieIngresos[$d] = ($serieIngresos[$d] ?? 0) + (float) $m->monto;
        }

        // ── 3. SERIE COMBINADA ────────────────────────────────────────────────
        $todasFechas = array_unique(array_merge(array_keys($serieGastos), array_keys($serieIngresos)));
        sort($todasFechas);

        $serieGeneral = [];
        foreach ($todasFechas as $fecha) {
            $g = $serieGastos[$fecha]   ?? 0;
            $i = $serieIngresos[$fecha] ?? 0;
            $serieGeneral[] = [
                'fecha'    => $fecha,
                'gastos'   => round($g, 2),
                'ingresos' => round($i, 2),
                'balance'  => round($i - $g, 2),
            ];
        }

        // ── 4. RESUMEN ────────────────────────────────────────────────────────
        $balance   = $totalIngresos - $totalGastos;
        $beneficio = max($balance, 0);
        $perdida   = max(-$balance, 0);

        return response()->json([
            'periodo' => [
                'tipo'  => $periodo,
                'desde' => $desdeStr,
                'hasta' => $hastaStr,
            ],
            'resumen' => [
                'total_ingresos' => round($totalIngresos, 2),
                'total_gastos'   => round($totalGastos,   2),
                'balance'        => round($balance,        2),
                'beneficio'      => round($beneficio,      2),
                'perdida'        => round($perdida,        2),
            ],
            'gastos' => [
                'total'         => round($totalGastos, 2),
                'por_categoria' => $gastosPorCategoria,
            ],
            'ingresos' => [
                'total'         => round($totalIngresos, 2),
                'por_categoria' => $ingresosPorCategoria,
            ],
            'serie_general' => $serieGeneral,
        ]);
    }
}