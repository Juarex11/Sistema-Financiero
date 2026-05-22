<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Billetera extends Model
{
    protected $table = 'billetera';

    protected $fillable = ['user_id', 'saldo', 'moneda'];

    protected $casts = ['saldo' => 'decimal:2'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(BilleteraMovimiento::class);
    }

    public function sumar(float $monto): void
    {
        $this->increment('saldo', $monto);
    }

    public function restar(float $monto): void
    {
        $this->decrement('saldo', $monto);
    }
}