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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('status', ['present', 'absent', 'late', 'excused'])
                ->default('absent');

            $table->enum('detection_method', ['system', 'manual', 'face_ai'])
                ->default('system');

            $table->decimal('confidence', 5, 2)->nullable();

            $table->enum('review_status', ['pending', 'confirmed', 'edited'])
                ->default('pending');

            $table->foreignId('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['attendance_session_id', 'student_id']);

            $table->index(['student_id', 'status']);
            $table->index(['detection_method', 'review_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
