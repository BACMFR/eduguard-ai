<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interventions')) {
            return;
        }

        Schema::create('interventions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('classroom_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('risk_score_id')
                ->nullable()
                ->constrained('risk_scores')
                ->nullOnDelete();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('type')->default('counseling');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');

            $table->string('title');
            $table->text('description')->nullable();
            $table->text('action_plan')->nullable();

            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('outcome_notes')->nullable();

            $table->timestamps();

            $table->index(['school_id', 'status']);
            $table->index(['student_id', 'status']);
            $table->index(['priority', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};