<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngresoConfig extends Model
{
    protected $table = 'ingreso_config';

    protected $fillable = [
        'user_id',
        'tipo',
        'monto_base',
        'dia_pago',
        'descripcion',
        'moneda',
    ];

    protected $casts = [
        'monto_base' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}