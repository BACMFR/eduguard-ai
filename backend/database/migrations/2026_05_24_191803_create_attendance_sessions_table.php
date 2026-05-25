<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();

            $table->date('session_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            $table->enum('source', ['manual', 'camera', 'import'])->default('manual');
            $table->enum('status', ['draft', 'completed', 'reviewed'])->default('draft');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['school_id', 'session_date']);
            $table->index(['classroom_id', 'session_date']);
            $table->index(['status', 'source']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
