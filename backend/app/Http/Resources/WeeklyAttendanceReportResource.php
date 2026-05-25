<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeeklyAttendanceReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'period' => $this->resource['period'],
            'filters' => $this->resource['filters'],

            'summary' => $this->resource['summary'],

            'charts' => [
                'daily_attendance' => $this->resource['daily_attendance'],
                'classroom_absence' => $this->resource['classroom_absence'],
                'status_distribution' => $this->resource['status_distribution'],
            ],

            'top_absent_students' => $this->resource['top_absent_students'],
        ];
    }
}