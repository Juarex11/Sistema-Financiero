<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Entrada extends Model
{
    protected $fillable = [
        'user_id', 'categoria_id', 'nombre', 'descripcion',
        'monto', 'moneda', 'dia_pago', 'hora_pago',
        'inicio_desde', 'imagen', 'activo',
    ];

    protected $casts = [
        'monto'  => 'decimal:2',
        'activo' => 'boolean',
    ];

    protected $appends = ['imagen_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(EntradaCategoria::class, 'categoria_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(BilleteraMovimiento::class);
    }

    public function getImagenUrlAttribute(): ?string
    {
        return $this->imagen
            ? Storage::disk('public')->url($this->imagen)
            : null;
    }
}