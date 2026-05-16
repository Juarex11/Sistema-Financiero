<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOnboarding extends Model
{
    protected $table = 'user_onboarding';

    protected $fillable = [
        'user_id',
        'ingreso_mensual',
        'moneda',
        'tipo_ingreso',
        'gastos_fijos',
        'tiene_deudas',
        'deuda_total',
        'tipos_deuda',
        'meta_principal',
        'completado',
        'ultimo_paso',
        'inicio_desde',
    ];

    protected $casts = [
        'gastos_fijos'   => 'array',
        'tipos_deuda'    => 'array',
        'tiene_deudas'   => 'boolean',
        'completado'     => 'boolean',
        'ingreso_mensual'=> 'decimal:2',
        'deuda_total'    => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}