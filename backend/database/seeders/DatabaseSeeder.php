<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Administrador
        User::updateOrCreate(
            ['email' => 'admin@app.com'],
            [
                'name'     => 'Administrador',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        // Usuario estándar
        User::updateOrCreate(
            ['email' => 'user@app.com'],
            [
                'name'     => 'Usuario Demo',
                'password' => Hash::make('password'),
                'role'     => 'user',
            ]
        );

        $this->command->info('✅ Usuarios creados: admin@app.com y user@app.com (contraseña: password)');
    }
}
