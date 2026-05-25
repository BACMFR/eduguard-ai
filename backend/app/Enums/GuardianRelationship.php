<?php
namespace App\Enums;

enum GuardianRelationship: string {
    case FATHER   = 'father';
    case MOTHER   = 'mother';
    case BROTHER  = 'brother';
    case SISTER   = 'sister';
    case RELATIVE = 'relative';
    case OTHER    = 'other';

    public function label(): string
    {
        return match ($this) {
            self::FATHER   => 'Father',
            self::MOTHER   => 'Mother',
            self::BROTHER  => 'Brother',
            self::SISTER   => 'Sister',
            self::RELATIVE => 'Relative',
            self::OTHER    => 'Other',
        };
    }
}
