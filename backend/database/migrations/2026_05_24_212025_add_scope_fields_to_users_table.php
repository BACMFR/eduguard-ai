<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('governorate_id')
                ->nullable()
                ->after('password')
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('district_id')
                ->nullable()
                ->after('governorate_id')
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('school_id')
                ->nullable()
                ->after('district_id')
                ->constrained()
                ->nullOnDelete();

            $table->boolean('is_active')
                ->default(true)
                ->after('school_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['governorate_id']);
            $table->dropForeign(['district_id']);
            $table->dropForeign(['school_id']);

            $table->dropColumn([
                'governorate_id',
                'district_id',
                'school_id',
                'is_active',
            ]);
        });
    }
};