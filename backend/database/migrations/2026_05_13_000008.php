<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configuración de ingresos del usuario
        Schema::create('ingreso_config', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->enum('tipo', ['fijo', 'variable', 'mixto']);

            // Fijo y base del mixto
            $table->decimal('monto_base', 10, 2)->nullable();

            // Día del mes en que se recibe (1-31)
            // Para fijo y la parte fija del mixto
            $table->unsignedTinyInteger('dia_pago')->default(1);

            $table->string('descripcion')->nullable(); // Ej: "Sueldo empresa X"
            $table->string('moneda', 3)->default('PEN');

            $table->timestamps();
            $table->unique('user_id'); // Un config por usuario
        });

        // Registro real de cada ingreso recibido
        Schema::create('ingresos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->decimal('monto', 10, 2);
            $table->string('moneda', 3)->default('PEN');
            $table->date('fecha');
            $table->string('descripcion')->nullable();

            $table->enum('tipo', ['fijo', 'variable', 'extra']);
            // fijo   → generado automáticamente cada mes
            // variable → ingresado manualmente cada mes
            // extra  → ingreso adicional (mixto o cualquier tipo)

            $table->boolean('confirmado')->default(false);
            // false → proyectado (aún no llega el dinero)
            // true  → confirmado (ya se recibió)

            $table->unsignedSmallInteger('mes');  // 1-12
            $table->unsignedSmallInteger('anio'); // 2026

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingresos');
        Schema::dropIfExists('ingreso_config');
    }
};