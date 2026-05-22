<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GastoMovimiento extends Model
{
    protected $fillable = [
        'user_id', 'billetera_id', 'gasto_id',
        'monto', 'moneda', 'tipo', 'estado',
        'descripcion', 'fecha', 'hora', 'mes', 'anio',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function billetera(): BelongsTo
    {
        return $this->belongsTo(Billetera::class);
    }

    public function gasto(): BelongsTo
    {
        return $this->belongsTo(Gasto::class);
    }
}