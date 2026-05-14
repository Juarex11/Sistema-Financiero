<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            if (!Schema::hasColumn('users', 'photo')) {
                $table->string('photo')->nullable()->after('role');
            }

            if (!Schema::hasColumn('users', 'currency')) {
                $table->string('currency', 10)->default('PEN')->after('photo');
            }

        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            if (Schema::hasColumn('users', 'photo')) {
                $table->dropColumn('photo');
            }

            if (Schema::hasColumn('users', 'currency')) {
                $table->dropColumn('currency');
            }

        });
    }
};