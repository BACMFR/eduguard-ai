<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,

            'name'             => $this->name,
            'code'             => $this->code,

            'type'             => [
                'value' => $this->type?->value,
                'label' => $this->type?->label(),
            ],

            'gender_type'      => [
                'value' => $this->gender_type?->value,
                'label' => $this->gender_type?->label(),
            ],

            'address'          => $this->address,
            'phone'            => $this->phone,
            'is_active'        => $this->is_active,

            'governorate'      => [
                'id'   => $this->whenLoaded('governorate', fn() => $this->governorate->id),
                'name' => $this->whenLoaded('governorate', fn() => $this->governorate->name),
            ],

            'district'         => [
                'id'   => $this->whenLoaded('district', fn() => $this->district->id),
                'name' => $this->whenLoaded('district', fn() => $this->district->name),
            ],

            'classrooms_count' => $this->when(isset($this->classrooms_count), $this->classrooms_count),
            'students_count'   => $this->when(isset($this->students_count), $this->students_count),

            'created_at'       => $this->created_at?->toDateTimeString(),
            'updated_at'       => $this->updated_at?->toDateTimeString(),
        ];
    }
}
