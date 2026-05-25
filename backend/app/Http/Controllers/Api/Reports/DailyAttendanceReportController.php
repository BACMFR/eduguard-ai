<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\DailyAttendanceReportRequest;
use App\Http\Resources\DailyAttendanceReportResource;
use App\Services\Reports\DailyAttendanceReportService;

class DailyAttendanceReportController extends Controller
{
    public function __construct(
        private readonly DailyAttendanceReportService $dailyAttendanceReportService
    ) {
    }

    public function __invoke(DailyAttendanceReportRequest $request): DailyAttendanceReportResource
    {
        $report = $this->dailyAttendanceReportService->generate(
            $request->validated()
        );

        return new DailyAttendanceReportResource($report);
    }
}