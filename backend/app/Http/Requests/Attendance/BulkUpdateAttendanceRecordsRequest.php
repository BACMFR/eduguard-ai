<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceDetectionMethod;
use App\Enums\AttendanceReviewStatus;
use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateAttendanceRecordsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'records' => ['required', 'array', 'min:1'],

            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.status' => ['required', Rule::enum(AttendanceStatus::class)],

            'records.*.detection_method' => [
                'sometimes',
                Rule::enum(AttendanceDetectionMethod::class),
            ],

            'records.*.confidence' => ['nullable', 'numeric', 'min:0', 'max:100'],

            'records.*.review_status' => [
                'sometimes',
                Rule::enum(AttendanceReviewStatus::class),
            ],

            'records.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}