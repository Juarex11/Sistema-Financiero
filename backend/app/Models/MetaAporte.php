<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetaAporte extends Model
{
    protected $fillable = [
        'meta_id', 'user_id', 'billetera_id',
        'monto', 'moneda', 'nota', 'fecha',
    ];

    protected $casts = [
        'monto' => 'float',
        'fecha' => 'date',
    ];

    public function meta(): BelongsTo
    {
        return $this->belongsTo(Meta::class);
    }

    public function billetera(): BelongsTo
    {
        return $this->belongsTo(Billetera::class);
    }
}