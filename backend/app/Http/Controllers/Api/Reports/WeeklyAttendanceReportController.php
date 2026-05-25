<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\WeeklyAttendanceReportRequest;
use App\Http\Resources\WeeklyAttendanceReportResource;
use App\Services\Reports\WeeklyAttendanceReportService;

class WeeklyAttendanceReportController extends Controller
{
    public function __construct(
        private readonly WeeklyAttendanceReportService $weeklyAttendanceReportService
    ) {
    }

    public function __invoke(WeeklyAttendanceReportRequest $request): WeeklyAttendanceReportResource
    {
        $report = $this->weeklyAttendanceReportService->generate(
            $request->validated()
        );

        return new WeeklyAttendanceReportResource($report);
    }
}