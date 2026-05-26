<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Gasto;
use App\Http\Controllers\GastoController;
use Carbon\Carbon;

class ProcesarGastos extends Command
{
    protected $signature   = 'gastos:procesar {--fecha= : Fecha a simular Y-m-d}';
    protected $description = 'Procesa gastos fijos y registra movimientos en billetera';

    public function handle()
    {
        $hoy = $this->option('fecha')
            ? Carbon::parse($this->option('fecha'))
            : now();

        $this->info("Procesando gastos para: {$hoy->toDateString()} — Día: {$hoy->day}");

        $gastos = Gasto::where('activo', true)
            ->where('configurado', true)
            ->where('dia_pago', $hoy->day)
            ->with('user')
            ->get();

        $this->info("Gastos encontrados: {$gastos->count()}");

        $controller = new GastoController();
        $procesados = 0;

      foreach ($gastos as $gasto) {
    if ($gasto->inicio_desde === 'proximo') {
        $creadoEsteMes = $gasto->created_at->month === $hoy->month
            && $gasto->created_at->year === $hoy->year;
        if ($creadoEsteMes) {
            $this->line("⏭ SKIP {$gasto->nombre} — creado este mes");
            continue;
        }
    }

    $controller->crearMovimientoPendiente($gasto->user, $gasto, $hoy);

    $tipo = $gasto->tipo_registro === 'automatico' ? '✓ AUTO' : '⏳ MANUAL';
    $this->info("{$tipo} {$gasto->nombre} — {$gasto->user->name}");
    $procesados++;
}

        $this->info("Procesados: {$procesados}");
    }
}