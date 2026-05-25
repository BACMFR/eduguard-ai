<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentRiskScoreResource extends JsonResource
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
                    'status' => is_object($this->student->status)
                        ? $this->student->status->value
                        : $this->student->status,
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

            'score' => $this->score,

            'level' => [
                'value' => is_object($this->level) ? $this->level->value : $this->level,
                'label' => is_object($this->level) ? $this->level->label() : ucfirst((string) $this->level),
            ],

            'calculated_from' => $this->calculated_from?->toDateString(),
            'calculated_to' => $this->calculated_to?->toDateString(),

            'model_version' => $this->model_version,
            'calculated_at' => $this->calculated_at?->toDateTimeString(),
            'summary' => $this->summary,

            'details' => StudentRiskScoreDetailResource::collection(
                $this->whenLoaded('details')
            ),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}