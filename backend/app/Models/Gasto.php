<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Gasto extends Model
{
    protected $fillable = [
        'user_id', 'categoria_id', 'nombre', 'descripcion',
        'monto', 'moneda', 'dia_pago', 'hora_pago',
        'tipo_registro', 'inicio_desde', 'imagen',
        'activo', 'configurado',
    ];

    protected $casts = [
        'monto'       => 'decimal:2',
        'activo'      => 'boolean',
        'configurado' => 'boolean',
    ];

    protected $appends = ['imagen_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(GastoCategoria::class, 'categoria_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(GastoMovimiento::class);
    }

    public function getImagenUrlAttribute(): ?string
    {
        return $this->imagen
            ? Storage::disk('public')->url($this->imagen)
            : null;
    }
}