<?php

namespace App\Enums;

enum SchoolGenderType: string
{
    case MALE = 'male';
    case FEMALE = 'female';
    case MIXED = 'mixed';

    public function label(): string
    {
        return match ($this) {
            self::MALE => 'Male',
            self::FEMALE => 'Female',
            self::MIXED => 'Mixed',
        };
    }
}