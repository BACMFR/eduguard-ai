<?php

namespace App\Services\Reports;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceSession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DailyAttendanceReportService
{
    public function generate(array $filters): array
    {
        $date = Carbon::parse($filters['date'])->toDateString();

        $baseSessionQuery = AttendanceSession::query()
            ->whereDate('session_date', $date)
            ->when($filters['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int|string $classroomId) {
                $query->where('classroom_id', $classroomId);
            });

        $sessionIds = (clone $baseSessionQuery)->pluck('id');

        $statusCounts = $this->getStatusCounts($sessionIds);

        $presentCount = $statusCounts[AttendanceStatus::PRESENT->value] ?? 0;
        $absentCount = $statusCounts[AttendanceStatus::ABSENT->value] ?? 0;
        $lateCount = $statusCounts[AttendanceStatus::LATE->value] ?? 0;
        $excusedCount = $statusCounts[AttendanceStatus::EXCUSED->value] ?? 0;

        $totalRecords = $presentCount + $absentCount + $lateCount + $excusedCount;

        $attendanceRate = $totalRecords > 0
            ? round(($presentCount / $totalRecords) * 100, 2)
            : 0;

        $absenceRate = $totalRecords > 0
            ? round(($absentCount / $totalRecords) * 100, 2)
            : 0;

        return [
            'date' => $date,

            'filters' => [
                'school_id' => $filters['school_id'] ?? null,
                'classroom_id' => $filters['classroom_id'] ?? null,
            ],

            'summary' => [
                'total_sessions' => $sessionIds->count(),
                'total_records' => $totalRecords,

                'present_count' => $presentCount,
                'absent_count' => $absentCount,
                'late_count' => $lateCount,
                'excused_count' => $excusedCount,

                'attendance_rate' => $attendanceRate,
                'absence_rate' => $absenceRate,
            ],

            'status_distribution' => $this->getStatusDistribution($statusCounts),
            'classroom_summary' => $this->getClassroomSummary($sessionIds),
            'sessions_timeline' => $this->getSessionsTimeline($sessionIds),

            'present_students' => $this->getStudentsByStatus($sessionIds, AttendanceStatus::PRESENT->value),
            'absent_students' => $this->getStudentsByStatus($sessionIds, AttendanceStatus::ABSENT->value),
            'late_students' => $this->getStudentsByStatus($sessionIds, AttendanceStatus::LATE->value),
            'excused_students' => $this->getStudentsByStatus($sessionIds, AttendanceStatus::EXCUSED->value),

            'sessions' => $this->getSessions($sessionIds),
        ];
    }

    private function getStatusCounts(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return DB::table('attendance_records')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('attendance_session_id', $sessionIds)
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    private function getStatusDistribution(array $statusCounts): array
    {
        return [
            [
                'status' => AttendanceStatus::PRESENT->value,
                'label' => AttendanceStatus::PRESENT->label(),
                'count' => $statusCounts[AttendanceStatus::PRESENT->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::ABSENT->value,
                'label' => AttendanceStatus::ABSENT->label(),
                'count' => $statusCounts[AttendanceStatus::ABSENT->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::LATE->value,
                'label' => AttendanceStatus::LATE->label(),
                'count' => $statusCounts[AttendanceStatus::LATE->value] ?? 0,
            ],
            [
                'status' => AttendanceStatus::EXCUSED->value,
                'label' => AttendanceStatus::EXCUSED->label(),
                'count' => $statusCounts[AttendanceStatus::EXCUSED->value] ?? 0,
            ],
        ];
    }

    private function getClassroomSummary(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        $rows = DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->join('classrooms', 'attendance_sessions.classroom_id', '=', 'classrooms.id')
            ->select(
                'classrooms.id as classroom_id',
                'classrooms.name as classroom_name',
                'classrooms.grade_level',
                'classrooms.section',
                'attendance_records.status',
                DB::raw('COUNT(*) as total')
            )
            ->whereIn('attendance_records.attendance_session_id', $sessionIds)
            ->groupBy(
                'classrooms.id',
                'classrooms.name',
                'classrooms.grade_level',
                'classrooms.section',
                'attendance_records.status'
            )
            ->get();

        return $rows
            ->groupBy('classroom_id')
            ->map(function ($items) {
                $first = $items->first();

                $present = (int) ($items->firstWhere('status', AttendanceStatus::PRESENT->value)->total ?? 0);
                $absent = (int) ($items->firstWhere('status', AttendanceStatus::ABSENT->value)->total ?? 0);
                $late = (int) ($items->firstWhere('status', AttendanceStatus::LATE->value)->total ?? 0);
                $excused = (int) ($items->firstWhere('status', AttendanceStatus::EXCUSED->value)->total ?? 0);

                $total = $present + $absent + $late + $excused;

                return [
                    'classroom_id' => $first->classroom_id,
                    'classroom_name' => $first->classroom_name,
                    'grade_level' => $first->grade_level,
                    'section' => $first->section,

                    'present_count' => $present,
                    'absent_count' => $absent,
                    'late_count' => $late,
                    'excused_count' => $excused,
                    'total_records' => $total,

                    'attendance_rate' => $total > 0
                        ? round(($present / $total) * 100, 2)
                        : 0,

                    'absence_rate' => $total > 0
                        ? round(($absent / $total) * 100, 2)
                        : 0,
                ];
            })
            ->values()
            ->toArray();
    }

    private function getSessionsTimeline(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return DB::table('attendance_sessions')
            ->join('classrooms', 'attendance_sessions.classroom_id', '=', 'classrooms.id')
            ->select(
                'attendance_sessions.id',
                'attendance_sessions.start_time',
                'attendance_sessions.end_time',
                'attendance_sessions.source',
                'attendance_sessions.status',
                'classrooms.name as classroom_name'
            )
            ->whereIn('attendance_sessions.id', $sessionIds)
            ->orderBy('attendance_sessions.start_time')
            ->get()
            ->map(function ($session) {
                return [
                    'session_id' => $session->id,
                    'classroom_name' => $session->classroom_name,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'source' => $session->source,
                    'status' => $session->status,
                ];
            })
            ->toArray();
    }

    private function getStudentsByStatus(Collection $sessionIds, string $status): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->join('students', 'attendance_records.student_id', '=', 'students.id')
            ->join('classrooms', 'attendance_sessions.classroom_id', '=', 'classrooms.id')
            ->select(
                'students.id as student_id',
                'students.student_number',
                'students.first_name',
                'students.last_name',
                'classrooms.id as classroom_id',
                'classrooms.name as classroom_name',
                'attendance_records.detection_method',
                'attendance_records.confidence',
                'attendance_records.review_status',
                'attendance_records.notes'
            )
            ->whereIn('attendance_records.attendance_session_id', $sessionIds)
            ->where('attendance_records.status', $status)
            ->orderBy('students.first_name')
            ->get()
            ->map(function ($student) {
                return [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => "{$student->first_name} {$student->last_name}",

                    'classroom' => [
                        'id' => $student->classroom_id,
                        'name' => $student->classroom_name,
                    ],

                    'detection_method' => $student->detection_method,
                    'confidence' => $student->confidence !== null
                        ? (float) $student->confidence
                        : null,

                    'review_status' => $student->review_status,
                    'notes' => $student->notes,
                ];
            })
            ->toArray();
    }

    private function getSessions(Collection $sessionIds): array
    {
        if ($sessionIds->isEmpty()) {
            return [];
        }

        return DB::table('attendance_sessions')
            ->join('schools', 'attendance_sessions.school_id', '=', 'schools.id')
            ->join('classrooms', 'attendance_sessions.classroom_id', '=', 'classrooms.id')
            ->select(
                'attendance_sessions.id',
                'attendance_sessions.session_date',
                'attendance_sessions.start_time',
                'attendance_sessions.end_time',
                'attendance_sessions.source',
                'attendance_sessions.status',
                'attendance_sessions.notes',
                'schools.id as school_id',
                'schools.name as school_name',
                'classrooms.id as classroom_id',
                'classrooms.name as classroom_name',
                'classrooms.grade_level',
                'classrooms.section'
            )
            ->whereIn('attendance_sessions.id', $sessionIds)
            ->orderBy('attendance_sessions.start_time')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_date' => $session->session_date,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'source' => $session->source,
                    'status' => $session->status,
                    'notes' => $session->notes,

                    'school' => [
                        'id' => $session->school_id,
                        'name' => $session->school_name,
                    ],

                    'classroom' => [
                        'id' => $session->classroom_id,
                        'name' => $session->classroom_name,
                        'grade_level' => $session->grade_level,
                        'section' => $session->section,
                    ],
                ];
            })
            ->toArray();
    }
}