<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GastoCategoria extends Model
{
    protected $fillable = ['user_id', 'nombre', 'color', 'icono'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gastos(): HasMany
    {
        return $this->hasMany(Gasto::class, 'categoria_id');
    }
}