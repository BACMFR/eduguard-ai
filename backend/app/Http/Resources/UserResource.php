<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => $this->name,
            'email' => $this->email,
            'is_active' => $this->is_active,

            'roles' => $this->getRoleNames()->values(),

            'permissions' => $this->getAllPermissions()
                ->pluck('name')
                ->values(),

            'scope' => [
                'governorate_id' => $this->governorate_id,
                'district_id' => $this->district_id,
                'school_id' => $this->school_id,
            ],

            'governorate' => $this->whenLoaded('governorate', function () {
                return [
                    'id' => $this->governorate?->id,
                    'name' => $this->governorate?->name,
                ];
            }),

            'district' => $this->whenLoaded('district', function () {
                return [
                    'id' => $this->district?->id,
                    'name' => $this->district?->name,
                ];
            }),

            'school' => $this->whenLoaded('school', function () {
                return [
                    'id' => $this->school?->id,
                    'name' => $this->school?->name,
                    'code' => $this->school?->code,
                ];
            }),

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}