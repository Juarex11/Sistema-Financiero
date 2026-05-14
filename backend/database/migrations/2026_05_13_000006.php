<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Tipo de entrada
            $table->enum('tipo', ['cita', 'reunion', 'evento', 'recordatorio', 'tarea']);

            // Información principal
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('lugar')->nullable();        // físico o link de videollamada
            $table->string('link_reunion')->nullable();  // Zoom, Meet, Teams, etc.

            // Fecha y hora
            $table->dateTime('fecha_inicio');
            $table->dateTime('fecha_fin')->nullable();
            $table->boolean('todo_el_dia')->default(false);
            $table->string('zona_horaria', 50)->default('America/Lima');

            // Recordatorio
            $table->integer('recordatorio_minutos')->nullable(); // 0, 15, 30, 60, 1440 (1 día)

            // Estado (principalmente para citas)
            $table->enum('estado', [
                'pendiente',
                'confirmada',
                'en_proceso',
                'finalizada',
                'cancelada',
            ])->default('pendiente');

            $table->text('motivo_cancelacion')->nullable();

            // Color de etiqueta
            $table->string('color', 7)->default('#6366f1'); // hex

            // Prioridad
            $table->enum('prioridad', ['baja', 'media', 'alta'])->default('media');

            // Repetición
            $table->enum('repeticion', ['ninguna', 'diaria', 'semanal', 'mensual', 'anual'])->default('ninguna');
            $table->date('repeticion_hasta')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'fecha_inicio']);
            $table->index('estado');
            $table->index('tipo');
        });

        Schema::create('agenda_contactos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->cascadeOnDelete();

            // Datos del cliente / participante
            $table->string('nombre');
            $table->string('email')->nullable();
            $table->string('telefono')->nullable();
            $table->string('empresa')->nullable();
            $table->string('cargo')->nullable();
            $table->text('notas')->nullable();

            // Si es usuario del sistema
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->enum('rol', ['cliente', 'participante', 'organizador', 'invitado'])->default('participante');
            $table->enum('confirmacion', ['pendiente', 'aceptado', 'rechazado'])->default('pendiente');

            $table->timestamps();
        });

        Schema::create('agenda_notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('contenido');
            $table->boolean('privada')->default(false);
            $table->timestamps();
        });

        Schema::create('agenda_archivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nombre_original');
            $table->string('ruta');
            $table->string('tipo_mime', 100);
            $table->unsignedBigInteger('tamanio'); // bytes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_archivos');
        Schema::dropIfExists('agenda_notas');
        Schema::dropIfExists('agenda_contactos');
        Schema::dropIfExists('agenda_eventos');
    }
};