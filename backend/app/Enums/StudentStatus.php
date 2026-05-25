<?php

namespace App\Enums;

enum StudentStatus: string
{
    case ACTIVE = 'active';
    case TRANSFERRED = 'transferred';
    case GRADUATED = 'graduated';
    case DROPPED_OUT = 'dropped_out';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::TRANSFERRED => 'Transferred',
            self::GRADUATED => 'Graduated',
            self::DROPPED_OUT => 'Dropped Out',
        };
    }
}