<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentRiskScoreDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'factor_name' => $this->factor_name,
            'factor_label' => $this->factor_label,
            'factor_value' => $this->factor_value,
            'impact_score' => $this->impact_score,
            'explanation' => $this->explanation,

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}