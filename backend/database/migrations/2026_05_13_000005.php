<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    if (Schema::hasColumn('anuncios', 'duracion_anclado')) {
        Schema::table('anuncios', function (Blueprint $table) {
            $table->string('duracion_anclado', 20)->nullable()->change();
        });
    }
}

    public function down(): void
    {
        Schema::table('anuncios', function (Blueprint $table) {
            $table->string('duracion_anclado', 10)->nullable()->change();
        });
    }
};