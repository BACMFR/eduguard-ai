<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StudentFaceProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $storageUrl = $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;

        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'image_path' => $this->image_path,
            'image_url' => $storageUrl ? url($storageUrl) : null,
            'image_api_url' => url("/api/students/{$this->student_id}/face-profiles/{$this->id}/image"),
            'status' => $this->status,
            'quality_score' => $this->quality_score,
            'confidence' => $this->confidence,
            'has_embedding' => ! empty($this->embedding),
            'metadata' => $this->metadata,
            'registered_by' => $this->whenLoaded('registeredBy', function () {
                return [
                    'id' => $this->registeredBy?->id,
                    'name' => $this->registeredBy?->name,
                    'email' => $this->registeredBy?->email,
                ];
            }),
            'registered_at' => $this->registered_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
