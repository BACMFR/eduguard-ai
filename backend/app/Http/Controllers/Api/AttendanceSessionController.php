<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\BulkUpdateAttendanceRecordsRequest;
use App\Http\Requests\Attendance\StoreAttendanceSessionRequest;
use App\Http\Requests\Attendance\UpdateAttendanceSessionRequest;
use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceSession;
use App\Services\AttendanceSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceSessionController extends Controller
{
    public function __construct(
        private readonly AttendanceSessionService $attendanceSessionService
    ) {
    }

    public function index(Request $request)
    {
        $sessions = $this->attendanceSessionService->list(
            $request->only([
                'school_id',
                'classroom_id',
                'status',
                'date_from',
                'date_to',
                'per_page',
            ])
        );

        return AttendanceSessionResource::collection($sessions);
    }

    public function store(StoreAttendanceSessionRequest $request): JsonResponse
    {
        $session = $this->attendanceSessionService->create($request->validated());

        return (new AttendanceSessionResource($session))
            ->additional([
                'message' => 'Attendance session created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(AttendanceSession $attendanceSession): AttendanceSessionResource
    {
        $session = $this->attendanceSessionService->show($attendanceSession);

        return new AttendanceSessionResource($session);
    }

    public function update(
        UpdateAttendanceSessionRequest $request,
        AttendanceSession $attendanceSession
    ): JsonResponse {
        $session = $this->attendanceSessionService->update(
            $attendanceSession,
            $request->validated()
        );

        return (new AttendanceSessionResource($session))
            ->additional([
                'message' => 'Attendance session updated successfully.',
            ])
            ->response();
    }

    public function destroy(AttendanceSession $attendanceSession): JsonResponse
    {
        $this->attendanceSessionService->delete($attendanceSession);

        return response()->json([
            'message' => 'Attendance session deleted successfully.',
        ]);
    }

    public function bulkUpdateRecords(
        BulkUpdateAttendanceRecordsRequest $request,
        AttendanceSession $attendanceSession
    ): JsonResponse {
        $session = $this->attendanceSessionService->bulkUpdateRecords(
            $attendanceSession,
            $request->validated('records')
        );

        return (new AttendanceSessionResource($session))
            ->additional([
                'message' => 'Attendance records updated successfully.',
            ])
            ->response();
    }
}