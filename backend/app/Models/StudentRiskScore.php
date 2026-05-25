<?php

namespace App\Models;

use App\Enums\RiskLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentRiskScore extends Model
{
    protected $fillable = [
        'student_id',
        'school_id',
        'classroom_id',
        'score',
        'level',
        'calculated_from',
        'calculated_to',
        'model_version',
        'calculated_at',
        'summary',
    ];

    protected $casts = [
        'level' => RiskLevel::class,
        'calculated_from' => 'date',
        'calculated_to' => 'date',
        'calculated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(StudentRiskScoreDetail::class);
    }
}