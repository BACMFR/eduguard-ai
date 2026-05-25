<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentFaceProfile extends Model
{
    protected $fillable = [
        'student_id',
        'image_path',
        'status',
        'quality_score',
        'confidence',
        'embedding',
        'metadata',
        'registered_by',
        'registered_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'embedding' => 'array',
            'quality_score' => 'decimal:2',
            'confidence' => 'decimal:2',
            'registered_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }
}