<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRiskScoreDetail extends Model
{
    protected $fillable = [
        'student_risk_score_id',
        'factor_name',
        'factor_label',
        'factor_value',
        'impact_score',
        'explanation',
    ];

    public function riskScore(): BelongsTo
    {
        return $this->belongsTo(StudentRiskScore::class, 'student_risk_score_id');
    }
}