<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('contenido');
            $table->string('cargo_empresa')->nullable();
            $table->unsignedTinyInteger('estrellas')->default(5); // 1-5
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            $table->boolean('destacado')->default(false);
            $table->timestamps();

            // Un usuario solo puede tener 1 testimonio
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonios');
    }
};