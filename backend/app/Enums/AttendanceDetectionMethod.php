<?php

namespace App\Enums;

enum AttendanceDetectionMethod: string
{
    case SYSTEM = 'system';
    case MANUAL = 'manual';
    case FACE_AI = 'face_ai';

    public function label(): string
    {
        return match ($this) {
            self::SYSTEM => 'System',
            self::MANUAL => 'Manual',
            self::FACE_AI => 'Face AI',
        };
    }
}