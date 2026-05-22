<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::create('gasto_categorias', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('nombre', 80);
        $table->string('color', 7)->default('#ef4444');
        $table->string('icono', 40)->default('Receipt');
        $table->timestamps();
    });
}
};