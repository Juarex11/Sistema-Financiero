<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonios', function (Blueprint $table) {<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonio extends Model
{
    protected $fillable = [
        'user_id',
        'contenido',
        'cargo_empresa',
        'estrellas',
        'estado',
        'destacado',
    ];

    protected $casts = [
        'estrellas' => 'integer',
        'destacado' => 'boolean',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeAprobados($query)
    {
        return $query->where('estado', 'aprobado');
    }

    public function scopeDestacados($query)
    {
        return $query->where('destacado', true);
    }
}
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('contenido');
            $table->string('cargo_empresa')->nullable();   // Cargo o empresa (opcional)
            $table->unsignedTinyInteger('estrellas')->default(5); // 1-5
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            $table->boolean('destacado')->default(false);  // Destacar en página pública
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