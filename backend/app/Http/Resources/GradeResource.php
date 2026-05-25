<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'student' => $this->whenLoaded('student', function () {
                return [
                    'id' => $this->student->id,
                    'student_number' => $this->student->student_number,
                    'full_name' => $this->student->full_name,
                ];
            }),

            'school' => $this->whenLoaded('school', function () {
                return [
                    'id' => $this->school->id,
                    'name' => $this->school->name,
                    'code' => $this->school->code,
                ];
            }),

            'classroom' => $this->whenLoaded('classroom', function () {
                return [
                    'id' => $this->classroom?->id,
                    'name' => $this->classroom?->name,
                    'grade_level' => $this->classroom?->grade_level,
                    'section' => $this->classroom?->section,
                ];
            }),

            'subject' => $this->whenLoaded('subject', function () {
                return [
                    'id' => $this->subject->id,
                    'name' => $this->subject->name,
                    'code' => $this->subject->code,
                ];
            }),

            'exam_name' => $this->exam_name,

            'grade_type' => [
                'value' => is_object($this->grade_type) ? $this->grade_type->value : $this->grade_type,
                'label' => is_object($this->grade_type) ? $this->grade_type->label() : ucfirst((string) $this->grade_type),
            ],

            'score' => (float) $this->score,
            'max_score' => (float) $this->max_score,
            'percentage' => $this->percentage,

            'exam_date' => $this->exam_date?->toDateString(),
            'notes' => $this->notes,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}