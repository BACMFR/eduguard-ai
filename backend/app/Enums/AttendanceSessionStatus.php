<?php

namespace App\Enums;

enum AttendanceSessionStatus: string
{
    case DRAFT = 'draft';
    case COMPLETED = 'completed';
    case REVIEWED = 'reviewed';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::COMPLETED => 'Completed',
            self::REVIEWED => 'Reviewed',
        };
    }
}