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
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('guardian_id')->nullable()->constrained()->nullOnDelete();

            $table->string('student_number')->unique();
            $table->string('national_id')->nullable()->unique();

            $table->string('first_name');
            $table->string('last_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date')->nullable();

            $table->enum('status', ['active', 'transferred', 'graduated', 'dropped_out'])
                ->default('active');

            $table->date('enrollment_date')->nullable();

            $table->boolean('face_registered')->default(false);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'classroom_id']);
            $table->index(['status', 'gender']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
