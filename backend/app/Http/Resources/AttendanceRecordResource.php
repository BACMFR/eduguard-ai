<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
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

            'status' => [
                'value' => is_object($this->status) ? $this->status->value : $this->status,
                'label' => is_object($this->status) ? $this->status->label() : ucfirst((string) $this->status),
            ],

            'detection_method' => [
                'value' => is_object($this->detection_method) ? $this->detection_method->value : $this->detection_method,
                'label' => is_object($this->detection_method) ? $this->detection_method->label() : ucfirst((string) $this->detection_method),
            ],

            'confidence' => $this->confidence,

            'review_status' => [
                'value' => is_object($this->review_status) ? $this->review_status->value : $this->review_status,
                'label' => is_object($this->review_status) ? $this->review_status->label() : ucfirst((string) $this->review_status),
            ],

            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toDateTimeString(),

            'notes' => $this->notes,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}