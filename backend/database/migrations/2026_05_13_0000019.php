// database/migrations/xxxx_create_billetera_transacciones_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('billetera_transacciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('billetera_id')->constrained('billetera')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->enum('tipo', ['ingreso', 'egreso']);
            $table->string('descripcion')->nullable();
            $table->date('fecha');
            $table->unsignedTinyInteger('mes');
            $table->unsignedSmallInteger('anio');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billetera_transacciones');
    }
};