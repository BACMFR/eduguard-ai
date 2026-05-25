<?php

namespace App\Enums;

enum AttendanceReviewStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case EDITED = 'edited';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::CONFIRMED => 'Confirmed',
            self::EDITED => 'Edited',
        };
    }
}