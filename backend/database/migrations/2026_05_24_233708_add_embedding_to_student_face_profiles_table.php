<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_face_profiles', function (Blueprint $table) {
            $table->json('embedding')->nullable()->after('confidence');
        });
    }

    public function down(): void
    {
        Schema::table('student_face_profiles', function (Blueprint $table) {
            $table->dropColumn('embedding');
        });
    }
};