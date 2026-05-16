<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingreso extends Model
{
    protected $fillable = [
        'user_id',
        'monto',
        'moneda',
        'fecha',
        'descripcion',
        'tipo',
        'confirmado',
        'mes',
        'anio',
    ];

    protected $casts = [
        'monto'      => 'decimal:2',
        'fecha'      => 'date',
        'confirmado' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}