<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Campos asignables masivamente.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',        // 'admin' | 'user'
    ];

    /**
     * Campos ocultos en serialización.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    /**
     * Helper: comprueba si el usuario es admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
