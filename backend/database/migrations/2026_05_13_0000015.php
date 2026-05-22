<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::create('billetera_movimientos', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('billetera_id')->constrained('billetera')->cascadeOnDelete();
        $table->foreignId('entrada_id')->nullable()->constrained('entradas')->nullOnDelete();
        $table->decimal('monto', 12, 2);
        $table->char('moneda', 3)->default('PEN');
        $table->enum('tipo', ['entrada', 'salida'])->default('entrada');
        $table->string('descripcion', 255)->nullable();
        $table->date('fecha');
        $table->time('hora')->nullable();
        $table->unsignedTinyInteger('mes');
$table->smallInteger('anio');
        $table->timestamps();

        $table->index(['user_id', 'mes', 'anio']);
        $table->index(['user_id', 'tipo']);
    });
}
};