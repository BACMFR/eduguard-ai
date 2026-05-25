<?php

namespace App\Models;

use App\Enums\AttendanceDetectionMethod;
use App\Enums\AttendanceReviewStatus;
use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'attendance_session_id',
        'student_id',
        'status',
        'detection_method',
        'confidence',
        'review_status',
        'reviewed_by',
        'reviewed_at',
        'notes',
    ];

    protected $casts = [
        'status' => AttendanceStatus::class,
        'detection_method' => AttendanceDetectionMethod::class,
        'review_status' => AttendanceReviewStatus::class,
        'confidence' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function attendanceSession(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}