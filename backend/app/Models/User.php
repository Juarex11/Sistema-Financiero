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

    public function ingresoConfig(): HasOne
    {
        return $this->hasOne(IngresoConfig::class);
    }

    public function ingresos(): HasMany
    {
        return $this->hasMany(Ingreso::class);
    }
}