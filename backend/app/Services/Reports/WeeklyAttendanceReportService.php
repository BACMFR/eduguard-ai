<?php
namespace App\Services\Reports;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WeeklyAttendanceReportService
{
    public function generate(array $filters): array
    {
        $weekStart = Carbon::parse($filters['week_start'])->startOfDay();
        $weekEnd   = $weekStart->copy()->addDays(6)->endOfDay();

        $baseSessionQuery = AttendanceSession::query()
            ->whereBetween('session_date', [
                $weekStart->toDateString(),
                $weekEnd->toDateString(),
            ])
            ->when($filters['school_id'] ?? null, function ($query, int | string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int | string $classroomId) {
                $query->where('classroom_id', $classroomId);
            });

        $sessionIds = (clone $baseSessionQuery)->pluck('id');

        $totalSessions = $sessionIds->count();

        $statusCounts = $this->getStatusCounts($sessionIds);

        $totalRecords = array_sum($statusCounts);

        $presentCount = $statusCounts[AttendanceStatus::PRESENT->value] ?? 0;
        $absentCount  = $statusCounts[AttendanceStatus::ABSENT->value] ?? 0;
        $lateCount    = $statusCounts[AttendanceStatus::LATE->value] ?? 0;
        $excusedCount = $statusCounts[AttendanceStatus::EXCUSED->value] ?? 0;

        $attendanceRate = $totalRecords > 0
            ? round(($presentCount / $totalRecords) * 100, 2)
            : 0;

        $absenceRate = $totalRecords > 0
            ? round(($absentCount / $totalRecords) * 100, 2)
            : 0;

        return [
            'period'              => [
                'week_start' => $weekStart->toDateString(),
                'week_end'   => $weekEnd->toDateString(),
            ],

            'filters'             => [
                'school_id'    => $filters['school_id'] ?? null,
                'classroom_id' => $filters['classroom_id'] ?? null,
            ],

            'summary'             => [
                'total_sessions'  => $totalSessions,
                'total_records'   => $totalRecords,
                'present_count'   => $presentCount,
                'absent_count'    => $absentCount,
                'late_count'      => $lateCount,
                'excused_count'   => $excusedCount,
                'attendance_rate' => $attendanceRate,
                'absence_rate'    => $absenceRate,
            ],

            'daily_attendance'    => $this->getDailyAttendance($sessionIds, $weekStart),
            'classroom_absence'   => $this->getClassroomAbsence($sessionIds),
            'status_distribution' => $this->getStatusDistribution($statusCounts),
            'top_absent_students' => $this->getTopAbsentStudents($sessionIds),
        ];
    }

    private function getStatusCounts(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return AttendanceRecord::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('attendance_session_id', $sessionIds)
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    private function getDailyAttendance(Collection $sessionIds, Carbon $weekStart): array
    {
        $days = collect(range(0, 6))->mapWithKeys(function (int $offset) use ($weekStart) {
            $date = $weekStart->copy()->addDays($offset)->toDateString();

            return [
                $date => [
                    'date'            => $date,
                    'present'         => 0,
                    'absent'          => 0,
                    'late'            => 0,
                    'excused'         => 0,
                    'attendance_rate' => 0,
                ],
            ];
        });

        if ($sessionIds->isEmpty()) {
            return $days->values()->toArray();
        }

        $records = AttendanceRecord::query()
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->select(
                'attendance_sessions.session_date',
                'attendance_records.status',
                DB::raw('COUNT(*) as total')
            )
            ->whereIn('attendance_records.attendance_session_id', $sessionIds)
            ->groupBy('attendance_sessions.session_date', 'attendance_records.status')
            ->get();

        foreach ($records as $record) {
            $date = Carbon::parse($record->session_date)->toDateString();

            if (! $days->has($date)) {
                continue;
            }

            $status = is_object($record->status)
                ? $record->status->value
                : $record->status;

            $day          = $days->get($date);
            $day[$status] = (int) $record->total;

            $days->put($date, $day);
        }

        return $days->map(function (array $day) {
            $total = $day['present'] + $day['absent'] + $day['late'] + $day['excused'];

            $day['attendance_rate'] = $total > 0
                ? round(($day['present'] / $total) * 100, 2)
                : 0;

            return $day;
        })->values()->toArray();
    }

    private function getClassroomAbsence(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return AttendanceRecord::query()
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->join('classrooms', 'attendance_sessions.classroom_id', '=', 'classrooms.id')
            ->select(
                'classrooms.id',
                'classrooms.name',
                'classrooms.grade_level',
                'classrooms.section',
                DB::raw('COUNT(*) as absent_count')
            )
            ->whereIn('attendance_records.attendance_session_id', $sessionIds)
            ->where('attendance_records.status', AttendanceStatus::ABSENT->value)
            ->groupBy(
                'classrooms.id',
                'classrooms.name',
                'classrooms.grade_level',
                'classrooms.section'
            )
            ->orderByDesc('absent_count')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                return [
                    'classroom_id'   => $row->id,
                    'classroom_name' => $row->name,
                    'grade_level'    => $row->grade_level,
                    'section'        => $row->section,
                    'absent_count'   => (int) $row->absent_count,
                ];
            })
            ->toArray();
    }

    private function getStatusDistribution(array $statusCounts): array
    {
        return [
            [
                'status' => AttendanceStatus::PRESENT->value,
                'label'  => AttendanceStatus::PRESENT->label(),
                'count'  => $statusCounts[AttendanceStatus::PRESENT->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::ABSENT->value,
                'label'  => AttendanceStatus::ABSENT->label(),
                'count'  => $statusCounts[AttendanceStatus::ABSENT->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::LATE->value,
                'label'  => AttendanceStatus::LATE->label(),
                'count'  => $statusCounts[AttendanceStatus::LATE->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::EXCUSED->value,
                'label'  => AttendanceStatus::EXCUSED->label(),
                'count'  => $statusCounts[AttendanceStatus::EXCUSED->value] ?? 0,
            ],
        ];
    }

    private function getTopAbsentStudents(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return AttendanceRecord::query()
            ->join('students', 'attendance_records.student_id', '=', 'students.id')
            ->select(
                'students.id',
                'students.student_number',
                'students.first_name',
                'students.last_name',
                DB::raw('COUNT(*) as absent_count')
            )
            ->whereIn('attendance_records.attendance_session_id', $sessionIds)
            ->where('attendance_records.status', AttendanceStatus::ABSENT->value)
            ->groupBy(
                'students.id',
                'students.student_number',
                'students.first_name',
                'students.last_name'
            )
            ->orderByDesc('absent_count')
            ->limit(10)
            ->get()
            ->map(function ($student) {
                return [
                    'student_id'     => $student->id,
                    'student_number' => $student->student_number,
                    'full_name'      => "{$student->first_name} {$student->last_name}",
                    'absent_count' => (int) $student->absent_count,
                ];
            })
            ->toArray();
    }
}
