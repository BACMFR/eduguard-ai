<?php
namespace App\Models;

use App\Enums\GradeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = [
        'student_id',
        'school_id',
        'classroom_id',
        'subject_id',
        'exam_name',
        'grade_type',
        'score',
        'max_score',
        'exam_date',
        'notes',
    ];

    protected $casts = [
        'grade_type' => GradeType::class,
        'score'      => 'decimal:2',
        'max_score'  => 'decimal:2',
        'exam_date'  => 'date',
    ];

    protected $appends = [
        'percentage',
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

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function getPercentageAttribute(): float
    {
        if ((float) $this->max_score <= 0) {
            return 0;
        }

        return round(((float) $this->score / (float) $this->max_score) * 100, 2);
    }
}
