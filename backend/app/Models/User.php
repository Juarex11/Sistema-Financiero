<?php

namespace App\Models;

use App\Models\UserOnboarding;
use App\Models\IngresoConfig;
use App\Models\Ingreso;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Ticket;
use App\Models\Billetera;
use App\Models\Entrada;
use App\Models\EntradaCategoria;
use App\Models\BilleteraMovimiento;
use App\Models\Gasto;
use App\Models\GastoCategoria;
use App\Models\GastoMovimiento;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'photo',
        'currency',
        'cargo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function onboarding(): HasOne
    {
        return $this->hasOne(UserOnboarding::class);
    }

    public function onboardingCompletado(): bool
    {
        return $this->onboarding?->completado === true;
    }
public function tickets(): HasMany
{
    return $this->hasMany(Ticket::class);
}
    public function ingresoConfig(): HasOne
    {
        return $this->hasOne(IngresoConfig::class);
    }

    public function ingresos(): HasMany
    {
        return $this->hasMany(Ingreso::class);
    }
    public function billetera(): HasOne
{
    return $this->hasOne(Billetera::class);
}

public function entradas(): HasMany
{
    return $this->hasMany(Entrada::class);
}

public function entradaCategorias(): HasMany
{
    return $this->hasMany(EntradaCategoria::class);
}

public function billeteraMovimientos(): HasMany
{
    return $this->hasMany(BilleteraMovimiento::class);
}
public function gastos(): HasMany
{
    return $this->hasMany(Gasto::class);
}

public function gastoCategorias(): HasMany
{
    return $this->hasMany(GastoCategoria::class);
}

public function gastoMovimientos(): HasMany
{
    return $this->hasMany(GastoMovimiento::class);
}
}