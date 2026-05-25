<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceSessionSource;
use App\Enums\AttendanceSessionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'classroom_id' => ['sometimes', 'required', 'integer', 'exists:classrooms,id'],

            'session_date' => ['sometimes', 'required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:start_time'],

            'source' => ['sometimes', Rule::enum(AttendanceSessionSource::class)],
            'status' => ['sometimes', Rule::enum(AttendanceSessionStatus::class)],

            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}