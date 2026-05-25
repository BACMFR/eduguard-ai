<?php
namespace App\Models;

use App\Enums\SchoolGenderType;
use App\Enums\SchoolType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    protected $fillable = [
        'governorate_id',
        'district_id',
        'name',
        'code',
        'type',
        'gender_type',
        'address',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'type'        => SchoolType::class,
        'gender_type' => SchoolGenderType::class,
        'is_active'   => 'boolean',
    ];

    public function governorate(): BelongsTo
    {
        return $this->belongsTo(Governorate::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function riskScores(): HasMany
    {
        return $this->hasMany(StudentRiskScore::class);
    }
}
