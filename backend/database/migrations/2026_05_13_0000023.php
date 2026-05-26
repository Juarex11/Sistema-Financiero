<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar columna monto_aportado a metas si no existe
        if (!Schema::hasColumn('metas', 'monto_aportado')) {
            Schema::table('metas', function (Blueprint $table) {
                $table->decimal('monto_aportado', 12, 2)->default(0)->after('monto_objetivo');
            });
        }

        // Crear tabla de aportes
        Schema::create('meta_aportes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meta_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('billetera_id')->constrained('billetera')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->string('moneda', 3)->default('PEN');
            $table->string('nota', 255)->nullable();
            $table->date('fecha');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meta_aportes');

        if (Schema::hasColumn('metas', 'monto_aportado')) {
            Schema::table('metas', function (Blueprint $table) {
                $table->dropColumn('monto_aportado');
            });
        }
    }
};