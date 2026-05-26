<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Información básica
            $table->string('nombre', 100);
            $table->string('descripcion', 255)->nullable();
            $table->string('imagen')->nullable();
            $table->string('color', 7)->default('#9333ea');
            $table->string('icono', 40)->default('Target');

            // Tipo de medición: 'monto' | 'porcentaje'
            $table->enum('tipo_medicion', ['monto', 'porcentaje'])->default('monto');

            // Para tipo 'monto'
            $table->decimal('monto_objetivo', 12, 2)->nullable();
            $table->decimal('monto_actual',   12, 2)->default(0);
            $table->string('moneda', 3)->default('PEN');

            // Para tipo 'porcentaje'
            $table->unsignedTinyInteger('porcentaje_actual')->default(0); // 0-100

            // Fecha límite
            $table->date('fecha_limite')->nullable();

            // Recordatorio
            // tipo_recordatorio: 'fecha' | 'periodico' | 'ambos'
            $table->enum('tipo_recordatorio', ['fecha', 'periodico', 'ambos'])->nullable();
            $table->date('recordatorio_fecha')->nullable();          // fecha exacta
            $table->unsignedTinyInteger('recordatorio_dia')->nullable(); // día del mes (1-31)

            // Estado: 'activa' | 'pausada' | 'completada'
            $table->enum('estado', ['activa', 'pausada', 'completada'])->default('activa');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metas');
    }
};