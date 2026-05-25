<?php

namespace App\Services;

use App\Enums\AttendanceDetectionMethod;
use App\Enums\AttendanceReviewStatus;
use App\Enums\AttendanceSessionSource;
use App\Enums\AttendanceSessionStatus;
use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AttendanceSessionService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return AttendanceSession::query()
            ->with([
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
            ])
            ->withCount([
                'records',
                'records as present_count' => function ($query) {
                    $query->where('status', AttendanceStatus::PRESENT->value);
                },
                'records as absent_count' => function ($query) {
                    $query->where('status', AttendanceStatus::ABSENT->value);
                },
                'records as late_count' => function ($query) {
                    $query->where('status', AttendanceStatus::LATE->value);
                },
                'records as excused_count' => function ($query) {
                    $query->where('status', AttendanceStatus::EXCUSED->value);
                },
            ])
            ->when($filters['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int|string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->when($filters['status'] ?? null, function ($query, string $status) {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function ($query, string $dateFrom) {
                $query->whereDate('session_date', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function ($query, string $dateTo) {
                $query->whereDate('session_date', '<=', $dateTo);
            })
            ->latest('session_date')
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): AttendanceSession
    {
        return DB::transaction(function () use ($data) {
            $classroom = Classroom::query()->findOrFail($data['classroom_id']);

            $data['school_id'] = $classroom->school_id;
            $data['source'] = $data['source'] ?? AttendanceSessionSource::MANUAL->value;
            $data['status'] = $data['status'] ?? AttendanceSessionStatus::DRAFT->value;

            $session = AttendanceSession::query()->create($data);

            $students = Student::query()
                ->where('classroom_id', $classroom->id)
                ->where('status', 'active')
                ->get(['id']);

            $now = now();

            $records = $students->map(function (Student $student) use ($session, $now) {
                return [
                    'attendance_session_id' => $session->id,
                    'student_id' => $student->id,
                    'status' => AttendanceStatus::ABSENT->value,
                    'detection_method' => AttendanceDetectionMethod::SYSTEM->value,
                    'review_status' => AttendanceReviewStatus::PENDING->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->toArray();

            if (! empty($records)) {
                AttendanceRecord::query()->insert($records);
            }

            return $this->show($session);
        });
    }

    public function show(AttendanceSession $attendanceSession): AttendanceSession
    {
        return $attendanceSession->load([
            'school:id,name,code',
            'classroom:id,name,grade_level,section',
            'records.student:id,student_number,first_name,last_name',
        ]);
    }

    public function update(AttendanceSession $attendanceSession, array $data): AttendanceSession
    {
        if (isset($data['classroom_id'])) {
            $classroom = Classroom::query()->findOrFail($data['classroom_id']);
            $data['school_id'] = $classroom->school_id;
        }

        $attendanceSession->update($data);

        return $this->show($attendanceSession->fresh());
    }

    public function delete(AttendanceSession $attendanceSession): void
    {
        $attendanceSession->delete();
    }

    public function bulkUpdateRecords(AttendanceSession $attendanceSession, array $records): AttendanceSession
    {
        DB::transaction(function () use ($attendanceSession, $records) {
            foreach ($records as $recordData) {
                AttendanceRecord::query()->updateOrCreate(
                    [
                        'attendance_session_id' => $attendanceSession->id,
                        'student_id' => $recordData['student_id'],
                    ],
                    [
                        'status' => $recordData['status'],
                        'detection_method' => $recordData['detection_method']
                            ?? AttendanceDetectionMethod::MANUAL->value,
                        'confidence' => $recordData['confidence'] ?? null,
                        'review_status' => $recordData['review_status']
                            ?? AttendanceReviewStatus::CONFIRMED->value,
                        'reviewed_at' => now(),
                        'notes' => $recordData['notes'] ?? null,
                    ]
                );
            }

            $attendanceSession->update([
                'status' => AttendanceSessionStatus::COMPLETED->value,
            ]);
        });

        return $this->show($attendanceSession->fresh());
    }
}