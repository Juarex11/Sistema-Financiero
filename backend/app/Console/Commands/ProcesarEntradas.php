<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Entrada;
use App\Models\User;
use App\Http\Controllers\EntradaController;
use Carbon\Carbon;

class ProcesarEntradas extends Command
{
    protected $signature   = 'entradas:procesar {--fecha= : Fecha a simular Y-m-d}';
    protected $description = 'Procesa entradas fijas y registra en billetera';

    public function handle()
    {
        $hoy = $this->option('fecha')
            ? Carbon::parse($this->option('fecha'))
            : now();

        $this->info("Procesando entradas para: {$hoy->toDateString()} — Día: {$hoy->day}");

        $entradas = Entrada::where('activo', true)
            ->where('dia_pago', $hoy->day)
            ->with('user')
            ->get();

        $this->info("Entradas encontradas: {$entradas->count()}");

        $controller  = new EntradaController();
        $procesadas  = 0;

foreach ($entradas as $entrada) {
    if ($entrada->inicio_desde === 'proximo') {
        $creadoEsteMes = $entrada->created_at->month === $hoy->month
            && $entrada->created_at->year === $hoy->year;
        if ($creadoEsteMes) {
            $this->line("⏭ SKIP {$entrada->nombre} — creada este mes");
            continue;
        }
    }

    $controller->registrarMovimiento($entrada->user, $entrada, $hoy);
    $procesadas++;
    $this->info("✓ {$entrada->nombre} — {$entrada->user->name}");
}

        $this->info("Procesadas: {$procesadas}");
    }
}