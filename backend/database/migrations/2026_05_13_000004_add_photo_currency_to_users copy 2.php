<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('anuncios')) {
            Schema::table('anuncios', function (Blueprint $table) {
                $table->string('duracion_anclado', 20)->nullable()->change();
            });
        } else {
            Schema::create('anuncios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('titulo');
                $table->text('contenido')->nullable();
                $table->string('imagen')->nullable();
                $table->timestamp('expira_at');
                $table->boolean('anclado')->default(false);
                $table->string('duracion_anclado', 20)->nullable();
                $table->timestamp('anclado_hasta')->nullable();
                $table->timestamps();

                $table->index('expira_at');
                $table->index('anclado_hasta');
                $table->index('anclado');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('anuncios');
    }
};