<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Governorate extends Model
{
    protected $fillable = [
        'name',
        'code',
    ];

    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
