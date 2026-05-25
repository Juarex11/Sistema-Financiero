<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BilleteraCategoria extends Model
{
    protected $table = 'billetera_categorias';

    protected $fillable = ['user_id', 'nombre', 'color', 'tipo'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transacciones(): HasMany
    {
        return $this->hasMany(BilleteraTransaccion::class, 'categoria_id');
    }
}