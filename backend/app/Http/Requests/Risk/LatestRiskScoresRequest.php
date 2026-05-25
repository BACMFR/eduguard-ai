<?php

namespace App\Http\Requests\Risk;

use App\Enums\RiskLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LatestRiskScoresRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'classroom_id' => ['nullable', 'integer', 'exists:classrooms,id'],
            'level' => ['nullable', Rule::enum(RiskLevel::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}