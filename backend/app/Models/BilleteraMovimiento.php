<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BilleteraMovimiento extends Model
{
    protected $fillable = [
        'user_id', 'billetera_id', 'entrada_id',
        'monto', 'moneda', 'tipo', 'descripcion',
        'fecha', 'hora', 'mes', 'anio',
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

    public function entrada(): BelongsTo
    {
        return $this->belongsTo(Entrada::class);
    }
}