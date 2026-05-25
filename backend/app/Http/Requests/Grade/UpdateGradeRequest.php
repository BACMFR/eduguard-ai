<?php

namespace App\Http\Requests\Grade;

use App\Enums\GradeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'required', 'integer', 'exists:students,id'],
            'subject_id' => ['sometimes', 'required', 'integer', 'exists:subjects,id'],

            'exam_name' => ['sometimes', 'required', 'string', 'max:255'],
            'grade_type' => ['sometimes', Rule::enum(GradeType::class)],

            'score' => ['sometimes', 'required', 'numeric', 'min:0'],
            'max_score' => ['sometimes', 'required', 'numeric', 'min:1'],

            'exam_date' => ['sometimes', 'required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}