<?php

namespace App\Enums;

enum GradeType: string
{
    case QUIZ = 'quiz';
    case HOMEWORK = 'homework';
    case MIDTERM = 'midterm';
    case FINAL = 'final';
    case ORAL = 'oral';
    case PRACTICAL = 'practical';

    public function label(): string
    {
        return match ($this) {
            self::QUIZ => 'Quiz',
            self::HOMEWORK => 'Homework',
            self::MIDTERM => 'Midterm',
            self::FINAL => 'Final',
            self::ORAL => 'Oral',
            self::PRACTICAL => 'Practical',
        };
    }
}