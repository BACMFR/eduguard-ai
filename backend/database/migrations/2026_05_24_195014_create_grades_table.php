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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();

            $table->string('exam_name');
            $table->enum('grade_type', [
                'quiz',
                'homework',
                'midterm',
                'final',
                'oral',
                'practical',
            ])->default('quiz');

            $table->decimal('score', 6, 2);
            $table->decimal('max_score', 6, 2)->default(100);

            $table->date('exam_date');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['student_id', 'exam_date']);
            $table->index(['school_id', 'classroom_id']);
            $table->index(['subject_id', 'grade_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
