<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_onboarding', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Paso 1 — Ingresos
            $table->decimal('ingreso_mensual', 10, 2)->nullable();
            $table->string('moneda', 3)->default('PEN');
            $table->enum('tipo_ingreso', ['fijo', 'variable', 'mixto'])->nullable();

            // Paso 2 — Gastos fijos (múltiple selección guardada como JSON)
            $table->json('gastos_fijos')->nullable();

            // Paso 3 — Deudas
            $table->boolean('tiene_deudas')->default(false);
            $table->decimal('deuda_total', 10, 2)->nullable();
            $table->json('tipos_deuda')->nullable();

            // Paso 4 — Meta principal
            $table->enum('meta_principal', [
                'ahorrar_mas',
                'controlar_gastos',
                'salir_deudas',
                'meta_especifica',
            ])->nullable();

            // Control
            $table->boolean('completado')->default(false);
            $table->tinyInteger('ultimo_paso')->default(0);

            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_onboarding');
    }
};