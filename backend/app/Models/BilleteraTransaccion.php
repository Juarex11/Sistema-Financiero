<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BilleteraTransaccion extends Model
{
    protected $table = 'billetera_transacciones';

    protected $fillable = [
        'user_id', 'billetera_id', 'categoria_id',
        'monto', 'tipo', 'descripcion', 'etiqueta',
        'fotos', 'fecha', 'mes', 'anio',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date',
        'fotos' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function billetera(): BelongsTo
    {
        return $this->belongsTo(Billetera::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(BilleteraCategoria::class, 'categoria_id');
    }
}