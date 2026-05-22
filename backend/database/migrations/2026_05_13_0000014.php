<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::create('entradas', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('categoria_id')->nullable()->constrained('entrada_categorias')->nullOnDelete();
        $table->string('nombre', 100);
        $table->string('descripcion', 255)->nullable();
        $table->decimal('monto', 12, 2);
        $table->char('moneda', 3)->default('PEN');
        $table->unsignedTinyInteger('dia_pago');
        $table->time('hora_pago')->nullable();
        $table->enum('inicio_desde', ['actual', 'proximo'])->default('proximo');
        $table->string('imagen')->nullable();
        $table->boolean('activo')->default(true);
        $table->timestamps();

        $table->index(['user_id', 'activo', 'dia_pago']);
    });
}
};