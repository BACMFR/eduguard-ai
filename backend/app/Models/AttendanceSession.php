<?php

namespace App\Models;

use App\Enums\AttendanceSessionSource;
use App\Enums\AttendanceSessionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceSession extends Model
{
    protected $fillable = [
        'school_id',
        'classroom_id',
        'session_date',
        'start_time',
        'end_time',
        'source',
        'status',
        'notes',
    ];

    protected $casts = [
        'session_date' => 'date',
        'source' => AttendanceSessionSource::class,
        'status' => AttendanceSessionStatus::class,
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}