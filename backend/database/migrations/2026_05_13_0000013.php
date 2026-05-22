<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('entrada_categorias', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('nombre', 80);
        $table->string('color', 7)->default('#9333ea');
        $table->string('icono', 40)->default('DollarSign');
        $table->timestamps();
    });
}
};