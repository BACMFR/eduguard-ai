<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DailyAttendanceReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'date' => $this->resource['date'],
            'filters' => $this->resource['filters'],

            'summary' => $this->resource['summary'],

            'charts' => [
                'status_distribution' => $this->resource['status_distribution'],
                'classroom_summary' => $this->resource['classroom_summary'],
                'sessions_timeline' => $this->resource['sessions_timeline'],
            ],

            'students' => [
                'present' => $this->resource['present_students'],
                'absent' => $this->resource['absent_students'],
                'late' => $this->resource['late_students'],
                'excused' => $this->resource['excused_students'],
            ],

            'sessions' => $this->resource['sessions'],
        ];
    }
}