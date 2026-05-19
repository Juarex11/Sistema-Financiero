<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserOnboarding;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use Carbon\Carbon;

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
            'tipo_ingreso'    => 'nullable|in:fijo,variable,mixto',
            'gastos_fijos'    => 'nullable|array',
            'tiene_deudas'    => 'nullable|boolean',
            'deuda_total'     => 'nullable|numeric|min:0',
            'tipos_deuda'     => 'nullable|array',
            'meta_principal'  => 'nullable|in:ahorrar_mas,controlar_gastos,salir_deudas,meta_especifica',
            'ultimo_paso'     => 'required|integer|min:1|max:4',
            'completado'      => 'nullable|boolean',
            'inicio_desde'    => 'nullable|in:actual,proximo',  // ← limpio
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
                        ->where('tipo', 'fijo')
                        ->where('mes', $hoy->month)
                        ->where('anio', $hoy->year)
                        ->exists();

                 if (!$existe) {
    Ingreso::create([
        'user_id'     => $user->id,
        'monto'       => $config->monto_base,
        'moneda'      => $config->moneda,
        'fecha'       => $hoy->toDateString(),  // ← fecha de hoy
        'descripcion' => $config->descripcion ?? 'Ingreso fijo mensual',
        'tipo'        => 'fijo',
        'confirmado'  => true,
        'mes'         => $hoy->month,
        'anio'        => $hoy->year,
    ]);
                    }
                }
            }
        }

        return response()->json([
            'message'    => 'Progreso guardado.',
            'onboarding' => $onboarding,
        ]);
    }
}