<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_onboarding', function (Blueprint $table) {
            $table->enum('inicio_desde', ['actual', 'proximo'])->default('actual')->after('meta_principal');
        });
    }

    public function down(): void
    {
        Schema::table('user_onboarding', function (Blueprint $table) {
            $table->dropColumn('inicio_desde');
        });
    }
};