<?php

namespace App\Http\Requests\Student;

use App\Enums\StudentGender;
use App\Enums\StudentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['required', 'integer', 'exists:schools,id'],
            'classroom_id' => ['nullable', 'integer', 'exists:classrooms,id'],
            'guardian_id' => ['nullable', 'integer', 'exists:guardians,id'],

            'student_number' => ['required', 'string', 'max:50', 'unique:students,student_number'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:students,national_id'],

            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],

            'gender' => ['required', Rule::enum(StudentGender::class)],
            'birth_date' => ['nullable', 'date'],

            'status' => ['sometimes', Rule::enum(StudentStatus::class)],
            'enrollment_date' => ['nullable', 'date'],

            'face_registered' => ['sometimes', 'boolean'],
        ];
    }
}