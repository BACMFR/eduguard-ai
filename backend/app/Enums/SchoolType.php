<?php

namespace App\Enums;

enum SchoolType: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case VOCATIONAL = 'vocational';

    public function label(): string
    {
        return match ($this) {
            self::PUBLIC => 'Public',
            self::PRIVATE => 'Private',
            self::VOCATIONAL => 'Vocational',
        };
    }
}