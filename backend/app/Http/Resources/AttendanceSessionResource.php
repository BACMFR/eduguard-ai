<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'school' => $this->whenLoaded('school', function () {
                return [
                    'id' => $this->school->id,
                    'name' => $this->school->name,
                    'code' => $this->school->code,
                ];
            }),

            'classroom' => $this->whenLoaded('classroom', function () {
                return [
                    'id' => $this->classroom->id,
                    'name' => $this->classroom->name,
                    'grade_level' => $this->classroom->grade_level,
                    'section' => $this->classroom->section,
                ];
            }),

            'session_date' => $this->session_date?->toDateString(),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,

            'source' => [
                'value' => is_object($this->source) ? $this->source->value : $this->source,
                'label' => is_object($this->source) ? $this->source->label() : ucfirst((string) $this->source),
            ],

            'status' => [
                'value' => is_object($this->status) ? $this->status->value : $this->status,
                'label' => is_object($this->status) ? $this->status->label() : ucfirst((string) $this->status),
            ],

            'records_count' => $this->when(isset($this->records_count), $this->records_count),
            'present_count' => $this->when(isset($this->present_count), $this->present_count),
            'absent_count' => $this->when(isset($this->absent_count), $this->absent_count),
            'late_count' => $this->when(isset($this->late_count), $this->late_count),
            'excused_count' => $this->when(isset($this->excused_count), $this->excused_count),

            'records' => AttendanceRecordResource::collection(
                $this->whenLoaded('records')
            ),

            'notes' => $this->notes,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}