<?php

namespace App\Enums;

enum AttendanceSessionSource: string
{
    case MANUAL = 'manual';
    case CAMERA = 'camera';
    case IMPORT = 'import';

    public function label(): string
    {
        return match ($this) {
            self::MANUAL => 'Manual',
            self::CAMERA => 'Camera',
            self::IMPORT => 'Import',
        };
    }
}