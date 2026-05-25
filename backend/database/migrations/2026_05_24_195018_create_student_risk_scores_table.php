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
        Schema::create('student_risk_scores', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->nullable()->constrained()->nullOnDelete();

            $table->unsignedTinyInteger('score');
            $table->enum('level', ['low', 'medium', 'high', 'critical']);

            $table->date('calculated_from')->nullable();
            $table->date('calculated_to')->nullable();

            $table->string('model_version')->default('rule_based_v1');
            $table->timestamp('calculated_at');

            $table->text('summary')->nullable();

            $table->timestamps();

            $table->index(['school_id', 'level']);
            $table->index(['student_id', 'calculated_at']);
            $table->index(['classroom_id', 'level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_risk_scores');
    }
};
