<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceHistoryController extends Controller
{
    public function __invoke(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $records = AttendanceRecord::query()
            ->with([
                'attendanceSession.school',
                'attendanceSession.classroom',
            ])
            ->join(
                'attendance_sessions',
                'attendance_records.attendance_session_id',
                '=',
                'attendance_sessions.id'
            )
            ->where('attendance_records.student_id', $student->id)
            ->when($validated['date_from'] ?? null, function ($query, string $dateFrom) {
                $query->whereDate('attendance_sessions.session_date', '>=', $dateFrom);
            })
            ->when($validated['date_to'] ?? null, function ($query, string $dateTo) {
                $query->whereDate('attendance_sessions.session_date', '<=', $dateTo);
            })
            ->select('attendance_records.*')
            ->orderByDesc('attendance_sessions.session_date')
            ->orderByDesc('attendance_sessions.start_time')
            ->get();

        $summary = $this->buildSummary($records);

        return response()->json([
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'student_number' => $student->student_number,
                    'full_name' => $student->full_name,
                ],

                'filters' => [
                    'date_from' => $validated['date_from'] ?? null,
                    'date_to' => $validated['date_to'] ?? null,
                ],

                'summary' => $summary,

                'charts' => [
                    'status_distribution' => [
                        [
                            'status' => 'present',
                            'label' => 'Present',
                            'count' => $summary['present_count'],
                        ],
                        [
                            'status' => 'absent',
                            'label' => 'Absent',
                            'count' => $summary['absent_count'],
                        ],
                        [
                            'status' => 'late',
                            'label' => 'Late',
                            'count' => $summary['late_count'],
                        ],
                        [
                            'status' => 'excused',
                            'label' => 'Excused',
                            'count' => $summary['excused_count'],
                        ],
                    ],
                ],

                'records' => $records->map(function (AttendanceRecord $record) {
                    $session = $record->attendanceSession;

                    return [
                        'id' => $record->id,

                        'session' => [
                            'id' => $session?->id,
                            'session_date' => $session?->session_date?->toDateString(),
                            'start_time' => $session?->start_time,
                            'end_time' => $session?->end_time,
                            'source' => $this->enumToArray($session?->source),
                            'status' => $this->enumToArray($session?->status),
                            'notes' => $session?->notes,
                        ],

                        'school' => [
                            'id' => $session?->school?->id,
                            'name' => $session?->school?->name,
                            'code' => $session?->school?->code,
                        ],

                        'classroom' => [
                            'id' => $session?->classroom?->id,
                            'name' => $session?->classroom?->name,
                            'grade_level' => $session?->classroom?->grade_level,
                            'section' => $session?->classroom?->section,
                        ],

                        'status' => $this->enumToArray($record->status),
                        'detection_method' => $this->enumToArray($record->detection_method),
                        'confidence' => $record->confidence,
                        'review_status' => $this->enumToArray($record->review_status),
                        'reviewed_by' => $record->reviewed_by,
                        'reviewed_at' => $record->reviewed_at?->toDateTimeString(),
                        'notes' => $record->notes,
                        'created_at' => $record->created_at?->toDateTimeString(),
                    ];
                })->values(),
            ],
        ]);
    }

    private function buildSummary($records): array
    {
        $present = $records->filter(fn ($record) => $this->enumValue($record->status) === 'present')->count();
        $absent = $records->filter(fn ($record) => $this->enumValue($record->status) === 'absent')->count();
        $late = $records->filter(fn ($record) => $this->enumValue($record->status) === 'late')->count();
        $excused = $records->filter(fn ($record) => $this->enumValue($record->status) === 'excused')->count();

        $total = $records->count();

        return [
            'total_records' => $total,
            'present_count' => $present,
            'absent_count' => $absent,
            'late_count' => $late,
            'excused_count' => $excused,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 2) : 0,
            'absence_rate' => $total > 0 ? round(($absent / $total) * 100, 2) : 0,
        ];
    }

    private function enumValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        return (string) $value;
    }

    private function enumToArray(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof \BackedEnum) {
            return [
                'value' => $value->value,
                'label' => method_exists($value, 'label')
                    ? $value->label()
                    : str($value->value)->replace('_', ' ')->title()->toString(),
            ];
        }

        return [
            'value' => (string) $value,
            'label' => str((string) $value)->replace('_', ' ')->title()->toString(),
        ];
    }
}