<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guardian extends Model
{
    protected $fillable = [
        'full_name',
        'national_id',
        'phone',
        'email',
        'relationship',
        'address',
    ];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}