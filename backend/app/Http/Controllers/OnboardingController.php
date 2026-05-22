<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\UserOnboarding;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use App\Models\Billetera;
use App\Models\BilleteraMovimiento;
use Carbon\Carbon;
use App\Models\Gasto;

class OnboardingController extends Controller
{
    public function estado(Request $request)
    {
        $onboarding = $request->user()->onboarding;

        return response()->json([
            'completado'  => $onboarding?->completado ?? false,
            'ultimo_paso' => $onboarding?->ultimo_paso ?? 0,
            'data'        => $onboarding,
        ]);
    }

    public function guardar(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'ingreso_mensual' => 'nullable|numeric|min:0',
            'moneda'          => 'nullable|string|size:3',
            'tipo_ingreso'    => 'nullable|in:fijo,variable',
            'gastos_fijos'    => 'nullable|array',
            'tiene_deudas'    => 'nullable|boolean',
            'deuda_total'     => 'nullable|numeric|min:0',
            'tipos_deuda'     => 'nullable|array',
            'meta_principal'  => 'nullable|in:ahorrar_mas,controlar_gastos,salir_deudas,meta_especifica',
            'ultimo_paso'     => 'required|integer|min:1|max:4',
            'completado'      => 'nullable|boolean',
            'inicio_desde'    => 'nullable|in:actual,proximo',
        ]);

        $onboarding = UserOnboarding::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        if (!empty($data['moneda'])) {
            $user->update(['currency' => $data['moneda']]);
        }

        if (!empty($data['completado']) && !empty($data['tipo_ingreso'])) {

            IngresoConfig::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'tipo'       => $data['tipo_ingreso'],
                    'monto_base' => $data['ingreso_mensual'] ?? null,
                    'dia_pago'   => 0,
                    'moneda'     => $data['moneda'] ?? $user->currency ?? 'PEN',
                ]
            );

            $inicio = $data['inicio_desde'] ?? 'proximo';

            if (!empty($data['ingreso_mensual']) && $inicio === 'actual') {
                $config = $user->fresh()->ingresoConfig;

                if ($config) {
                    $hoy = now();

                    $existe = Ingreso::where('user_id', $user->id)
                        ->where('mes', $hoy->month)
                        ->where('anio', $hoy->year)
                        ->whereIn('tipo', ['fijo', 'variable'])
                        ->exists();

                    if (!$existe) {
                        Ingreso::create([
                            'user_id'     => $user->id,
                            'monto'       => $config->monto_base,
                            'moneda'      => $config->moneda,
                            'fecha'       => $hoy->toDateString(),
                            'descripcion' => $config->descripcion ?? 'Ingreso mensual',
                            'tipo'        => $data['tipo_ingreso'] === 'variable' ? 'variable' : 'fijo',
                            'confirmado'  => true,
                            'mes'         => $hoy->month,
                            'anio'        => $hoy->year,
                        ]);

                        // Sumar a billetera
                        $billetera = $user->billetera ?? Billetera::create([
                            'user_id' => $user->id,
                            'saldo'   => 0,
                            'moneda'  => $config->moneda,
                        ]);

                        DB::transaction(function () use ($billetera, $user, $config, $hoy) {
                            BilleteraMovimiento::create([
                                'user_id'      => $user->id,
                                'billetera_id' => $billetera->id,
                                'entrada_id'   => null,
                                'monto'        => $config->monto_base,
                                'moneda'       => $config->moneda,
                                'tipo'         => 'entrada',
                                'descripcion'  => 'Ingreso mensual',
                                'fecha'        => $hoy->toDateString(),
                                'hora'         => null,
                                'mes'          => $hoy->month,
                                'anio'         => $hoy->year,
                            ]);

                            $billetera->sumar((float) $config->monto_base);
                        });
                    }
                }
            }

             // ← AGREGAR AQUÍ, antes del cierre
    if (!empty($data['gastos_fijos']) && is_array($data['gastos_fijos'])) {
        $nombresMap = [
            'alquiler'   => 'Alquiler',
            'servicios'  => 'Servicios (agua, luz, gas)',
            'transporte' => 'Transporte',
            'educacion'  => 'Educación',
            'salud'      => 'Salud / Seguro',
            'internet'   => 'Internet / Celular',
        ];

        foreach ($data['gastos_fijos'] as $key) {
            $nombre = $nombresMap[$key] ?? ucfirst($key);

            $yaExiste = Gasto::where('user_id', $user->id)
                ->where('nombre', $nombre)
                ->exists();

            if (!$yaExiste) {
                Gasto::create([
                    'user_id'       => $user->id,
                    'nombre'        => $nombre,
                    'moneda'        => $data['moneda'] ?? $user->currency ?? 'PEN',
                    'tipo_registro' => 'manual',
                    'inicio_desde'  => 'proximo',
                    'activo'        => true,
                    'configurado'   => false,
                ]);
            }
        }
    }

        }  // ← cierra if completado

        return response()->json([
            'message'    => 'Progreso guardado.',
            'onboarding' => $onboarding,
        ]);
    }
}