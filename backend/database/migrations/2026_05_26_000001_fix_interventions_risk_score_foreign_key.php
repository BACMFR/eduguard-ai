<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('interventions') || ! Schema::hasTable('student_risk_scores')) {
            return;
        }

        if (! Schema::hasColumn('interventions', 'risk_score_id')) {
            return;
        }

        try {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropForeign(['risk_score_id']);
            });
        } catch (Throwable $exception) {
            /*
             * The foreign key may not exist if the old migration failed before
             * creating it. Continue and create the correct FK below.
             */
        }

        try {
            DB::statement(
                'ALTER TABLE interventions ADD CONSTRAINT interventions_risk_score_id_foreign FOREIGN KEY (risk_score_id) REFERENCES student_risk_scores(id) ON DELETE SET NULL'
            );
        } catch (Throwable $exception) {
            /*
             * Ignore duplicate FK errors on environments where the corrected
             * migration was already applied.
             */
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('interventions') || ! Schema::hasColumn('interventions', 'risk_score_id')) {
            return;
        }

        try {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropForeign(['risk_score_id']);
            });
        } catch (Throwable $exception) {
            // No-op.
        }
    }
};
