<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meta extends Model
{
    protected $fillable = [
        'user_id', 'nombre', 'descripcion', 'imagen', 'color', 'icono',
        'tipo_medicion', 'monto_objetivo', 'monto_aportado', 'moneda',
        'porcentaje_actual', 'fecha_limite', 'tipo_recordatorio',
        'recordatorio_fecha', 'recordatorio_dia', 'estado',
    ];

    protected $casts = [
        'monto_objetivo'     => 'float',
        'monto_aportado'     => 'float',
        'porcentaje_actual'  => 'integer',
        'recordatorio_dia'   => 'integer',
        'fecha_limite'       => 'date',
        'recordatorio_fecha' => 'date',
    ];

    protected $appends = ['progreso', 'dias_restantes'];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function aportes(): HasMany
    {
        return $this->hasMany(MetaAporte::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getProgresoAttribute(): int
    {
        if ($this->tipo_medicion === 'porcentaje') {
            return min((int) $this->porcentaje_actual, 100);
        }
        if (!$this->monto_objetivo || $this->monto_objetivo <= 0) return 0;
        return min((int) round(($this->monto_aportado / $this->monto_objetivo) * 100), 100);
    }

    public function getDiasRestantesAttribute(): ?int
    {
        if (!$this->fecha_limite) return null;
        return (int) now()->startOfDay()->diffInDays($this->fecha_limite->copy()->startOfDay(), false);
    }
}