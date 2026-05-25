<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class WeeklyAttendanceReportRequest extends FormRequest
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
            'week_start' => ['required', 'date'],
        ];
    }
}