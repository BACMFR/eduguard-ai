<?php

namespace App\Http\Requests\Student;

use App\Enums\StudentGender;
use App\Enums\StudentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $student = $this->route('student');

        return [
            'school_id' => ['sometimes', 'required', 'integer', 'exists:schools,id'],
            'classroom_id' => ['nullable', 'integer', 'exists:classrooms,id'],
            'guardian_id' => ['nullable', 'integer', 'exists:guardians,id'],

            'student_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('students', 'student_number')->ignore($student?->id),
            ],

            'national_id' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('students', 'national_id')->ignore($student?->id),
            ],

            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],

            'gender' => ['sometimes', 'required', Rule::enum(StudentGender::class)],
            'birth_date' => ['nullable', 'date'],

            'status' => ['sometimes', 'required', Rule::enum(StudentStatus::class)],
            'enrollment_date' => ['nullable', 'date'],

            'face_registered' => ['sometimes', 'boolean'],
        ];
    }
}