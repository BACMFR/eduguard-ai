<?php
namespace App\Models;

use App\Enums\StudentGender;
use App\Enums\StudentStatus;
use App\Models\StudentFaceProfile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'school_id',
        'classroom_id',
        'guardian_id',
        'student_number',
        'national_id',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'status',
        'enrollment_date',
        'face_registered',
    ];

    protected $casts = [
        'gender'          => StudentGender::class,
        'status'          => StudentStatus::class,
        'birth_date'      => 'date',
        'enrollment_date' => 'date',
        'face_registered' => 'boolean',
    ];

    protected $appends = [
        'full_name',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function riskScores(): HasMany
    {
        return $this->hasMany(StudentRiskScore::class);
    }

    public function latestRiskScore()
    {
        return $this->hasOne(StudentRiskScore::class)->latestOfMany();
    }

    public function faceProfiles(): HasMany
    {
        return $this->hasMany(StudentFaceProfile::class);
    }
}
