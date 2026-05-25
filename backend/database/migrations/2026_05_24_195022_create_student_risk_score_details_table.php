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
        Schema::create('student_risk_score_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_risk_score_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('factor_name');
            $table->string('factor_label');

            $table->string('factor_value')->nullable();
            $table->unsignedTinyInteger('impact_score')->default(0);

            $table->text('explanation')->nullable();

            $table->timestamps();

            $table->index(['factor_name', 'impact_score']);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_risk_score_details');
    }
};
