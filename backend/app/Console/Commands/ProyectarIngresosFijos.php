<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use Carbon\Carbon;

class ProyectarIngresosFijos extends Command
{
    protected $signature = 'ingresos:proyectar {--fecha= : Fecha a simular en formato Y-m-d}';

    protected $description = 'Proyecta ingresos fijos del mes según el día de pago configurado';

    public function handle()
    {
        $hoy = $this->option('fecha')
            ? Carbon::parse($this->option('fecha'))
            : now();

        $configs = IngresoConfig::where('tipo', 'fijo')
            ->whereNotNull('monto_base')
            ->where('dia_pago', '!=', 0)
            ->get();

        $proyectados = 0;

        foreach ($configs as $config) {

            // Solo ejecutar si hoy coincide con el día de pago
            if ($hoy->day !== (int) $config->dia_pago) {
                continue;
            }

            // Verificar si ya existe ingreso este mes
            $existe = Ingreso::where('user_id', $config->user_id)
                ->where('tipo', 'fijo')
                ->where('mes', $hoy->month)
                ->where('anio', $hoy->year)
                ->exists();

            if ($existe) {
                $this->line("⏭ SKIP ingreso user_id={$config->user_id} — ya existe este mes");
                continue;
            }

            // Crear ingreso
            Ingreso::create([
                'user_id'     => $config->user_id,
                'monto'       => $config->monto_base,
                'moneda'      => $config->moneda,
                'fecha'       => $hoy->toDateString(),
                'descripcion' => $config->descripcion ?? 'Ingreso fijo mensual',
                'tipo'        => 'fijo',
                'confirmado'  => true,
                'mes'         => $hoy->month,
                'anio'        => $hoy->year,
            ]);

            $proyectados++;

            $this->info(
                "✓ Ingreso proyectado user_id={$config->user_id} — {$config->monto_base} {$config->moneda}"
            );
        }

        $this->newLine();
        $this->info("Total proyectados: {$proyectados}");

        return Command::SUCCESS;
    }
}