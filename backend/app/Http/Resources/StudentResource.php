<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,

            'student_number'  => $this->student_number,
            'national_id'     => $this->national_id,

            'first_name'      => $this->first_name,
            'last_name'       => $this->last_name,
            'full_name'       => $this->full_name,

            'gender'          => [
                'value' => is_object($this->gender) ? $this->gender->value : $this->gender,
                'label' => is_object($this->gender) ? $this->gender->label() : ucfirst((string) $this->gender),
            ],

            'status'          => [
                'value' => is_object($this->status) ? $this->status->value : $this->status,
                'label' => is_object($this->status) ? $this->status->label() : ucfirst((string) $this->status),
            ],

            'birth_date'      => $this->birth_date?->toDateString(),
            'enrollment_date' => $this->enrollment_date?->toDateString(),
            'face_registered' => $this->face_registered,

            'school'          => $this->whenLoaded('school', function () {
                return [
                    'id'   => $this->school->id,
                    'name' => $this->school->name,
                    'code' => $this->school->code,
                ];
            }),

            'classroom'       => $this->whenLoaded('classroom', function () {
                return [
                    'id'          => $this->classroom?->id,
                    'name'        => $this->classroom?->name,
                    'grade_level' => $this->classroom?->grade_level,
                    'section'     => $this->classroom?->section,
                ];
            }),

            'guardian'        => $this->whenLoaded('guardian', function () {
                return [
                    'id'           => $this->guardian?->id,
                    'first_name'   => $this->guardian?->first_name,
                    'last_name'    => $this->guardian?->last_name,
                    'full_name'    => $this->guardian?->full_name,
                    'national_id'  => $this->guardian?->national_id,
                    'relationship' => $this->guardian?->relationship,
                    'phone'        => $this->guardian?->phone,
                    'email'        => $this->guardian?->email,
                    'address'      => $this->guardian?->address,
                ];
            }),

            'created_at'      => $this->created_at?->toDateTimeString(),
            'updated_at'      => $this->updated_at?->toDateTimeString(),
        ];
    }
}
