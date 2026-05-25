// php artisan make:migration create_billetera_categorias_table

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('billetera_categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->string('color', 7)->default('#6366f1');
            $table->enum('tipo', ['ingreso', 'egreso', 'ambos'])->default('ambos');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billetera_categorias');
    }
};