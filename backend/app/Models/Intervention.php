<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'school_id',
        'classroom_id',
        'risk_score_id',
        'assigned_to',
        'type',
        'priority',
        'status',
        'title',
        'description',
        'action_plan',
        'due_date',
        'completed_at',
        'outcome_notes',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
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

    public function riskScore(): BelongsTo
    {
        return $this->belongsTo(StudentRiskScore::class, 'risk_score_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
