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
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();

            $table->string('name');                     // مثال: التاسع A
            $table->unsignedTinyInteger('grade_level'); // 1 إلى 12
            $table->string('section')->nullable();      // A, B, C
            $table->unsignedSmallInteger('capacity')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['school_id', 'grade_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};
