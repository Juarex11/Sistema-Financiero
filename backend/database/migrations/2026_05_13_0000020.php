// Crea una nueva migración para agregar las columnas
// php artisan make:migration add_fields_to_billetera_transacciones_table

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('billetera_transacciones', function (Blueprint $table) {
            $table->foreignId('categoria_id')->nullable()->constrained('billetera_categorias')->nullOnDelete()->after('billetera_id');
            $table->string('etiqueta')->nullable()->after('descripcion');
            $table->json('fotos')->nullable()->after('etiqueta');
        });
    }

    public function down(): void
    {
        Schema::table('billetera_transacciones', function (Blueprint $table) {
            $table->dropForeign(['categoria_id']);
            $table->dropColumn(['categoria_id', 'etiqueta', 'fotos']);
        });
    }
};