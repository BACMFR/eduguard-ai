<?php

namespace App\Http\Requests\Classroom;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassroomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['required', 'integer', 'exists:schools,id'],

            'name' => ['required', 'string', 'max:255'],
            'grade_level' => ['required', 'integer', 'between:1,12'],
            'section' => ['nullable', 'string', 'max:20'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],

            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}