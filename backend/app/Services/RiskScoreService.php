<?php
namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\RiskLevel;
use App\Models\AttendanceRecord;
use App\Models\Grade;
use App\Models\Student;
use App\Models\StudentRiskScore;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RiskScoreService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return StudentRiskScore::query()
            ->with([
                'student:id,student_number,first_name,last_name,status',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'details',
            ])
            ->when($filters['student_id'] ?? null, function ($query, int | string $studentId) {
                $query->where('student_id', $studentId);
            })
            ->when($filters['school_id'] ?? null, function ($query, int | string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int | string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->when($filters['level'] ?? null, function ($query, string $level) {
                $query->where('level', $level);
            })
            ->latest('calculated_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    public function calculateForStudent(array $data): StudentRiskScore
    {
        return DB::transaction(function () use ($data) {
            $student = Student::query()
                ->with(['school', 'classroom'])
                ->findOrFail($data['student_id']);

            $dateFrom = $data['date_from'];
            $dateTo   = $data['date_to'];

            $details = [];

            $attendanceStats = $this->getAttendanceStats($student, $dateFrom, $dateTo);
            $gradeStats      = $this->getGradeStats($student, $dateFrom, $dateTo);

            $score = 0;

            $absenceImpact = $this->calculateAbsenceImpact($attendanceStats);
            if ($absenceImpact['impact_score'] > 0) {
                $score     += $absenceImpact['impact_score'];
                $details[]  = $absenceImpact;
            }

            $lateImpact = $this->calculateLateImpact($attendanceStats);
            if ($lateImpact['impact_score'] > 0) {
                $score     += $lateImpact['impact_score'];
                $details[]  = $lateImpact;
            }

            $gradeAverageImpact = $this->calculateGradeAverageImpact($gradeStats);
            if ($gradeAverageImpact['impact_score'] > 0) {
                $score     += $gradeAverageImpact['impact_score'];
                $details[]  = $gradeAverageImpact;
            }

            $lowGradesImpact = $this->calculateLowGradesImpact($gradeStats);
            if ($lowGradesImpact['impact_score'] > 0) {
                $score     += $lowGradesImpact['impact_score'];
                $details[]  = $lowGradesImpact;
            }

            $faceRegistrationImpact = $this->calculateFaceRegistrationImpact($student);
            if ($faceRegistrationImpact['impact_score'] > 0) {
                $score     += $faceRegistrationImpact['impact_score'];
                $details[]  = $faceRegistrationImpact;
            }

            $score = min($score, 100);
            $level = RiskLevel::fromScore($score);

            $riskScore = StudentRiskScore::query()->create([
                'student_id'      => $student->id,
                'school_id'       => $student->school_id,
                'classroom_id'    => $student->classroom_id,
                'score'           => $score,
                'level'           => $level->value,
                'calculated_from' => $dateFrom,
                'calculated_to'   => $dateTo,
                'model_version'   => 'rule_based_v1',
                'calculated_at'   => now(),
                'summary'         => $this->buildSummary($score, $level, $details),
            ]);

            foreach ($details as $detail) {
                $riskScore->details()->create($detail);
            }

            return $riskScore->load([
                'student:id,student_number,first_name,last_name,status',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'details',
            ]);
        });
    }

    private function getAttendanceStats(Student $student, string $dateFrom, string $dateTo): array
    {
        $rows = AttendanceRecord::query()
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->select('attendance_records.status', DB::raw('COUNT(*) as total'))
            ->where('attendance_records.student_id', $student->id)
            ->whereBetween('attendance_sessions.session_date', [$dateFrom, $dateTo])
            ->groupBy('attendance_records.status')
            ->pluck('total', 'status')
            ->toArray();

        $present = (int) ($rows[AttendanceStatus::PRESENT->value] ?? 0);
        $absent  = (int) ($rows[AttendanceStatus::ABSENT->value] ?? 0);
        $late    = (int) ($rows[AttendanceStatus::LATE->value] ?? 0);
        $excused = (int) ($rows[AttendanceStatus::EXCUSED->value] ?? 0);

        $total = $present + $absent + $late + $excused;

        return [
            'present'      => $present,
            'absent'       => $absent,
            'late'         => $late,
            'excused'      => $excused,
            'total'        => $total,
            'absence_rate' => $total > 0 ? round(($absent / $total) * 100, 2) : 0,
            'late_rate'    => $total > 0 ? round(($late / $total) * 100, 2) : 0,
        ];
    }

    private function getGradeStats(Student $student, string $dateFrom, string $dateTo): array
    {
        $grades = Grade::query()
            ->where('student_id', $student->id)
            ->whereBetween('exam_date', [$dateFrom, $dateTo])
            ->get();

        $percentages = $grades->map(function (Grade $grade) {
            return $grade->percentage;
        });

        $average = $percentages->count() > 0
            ? round($percentages->avg(), 2)
            : null;

        $lowGradesCount = $percentages
            ->filter(fn(float $percentage) => $percentage < 50)
            ->count();

        return [
            'grades_count'     => $grades->count(),
            'average'          => $average,
            'low_grades_count' => $lowGradesCount,
        ];
    }

    private function calculateAbsenceImpact(array $attendanceStats): array
    {
        $absenceRate = $attendanceStats['absence_rate'];

        $impact = match (true) {
            $absenceRate >= 30 => 35,
            $absenceRate >= 20 => 25,
            $absenceRate >= 10 => 15,
            default            => 0,
        };

        return [
            'factor_name'  => 'absence_rate',
            'factor_label' => 'Absence Rate',
            'factor_value' => $absenceRate . '%',
            'impact_score' => $impact,
            'explanation'  => "Student absence rate is {$absenceRate}% during the selected period.",
        ];
    }

    private function calculateLateImpact(array $attendanceStats): array
    {
        $lateCount = $attendanceStats['late'];

        $impact = match (true) {
            $lateCount >= 5 => 15,
            $lateCount >= 3 => 8,
            default         => 0,
        };

        return [
            'factor_name'  => 'late_count',
            'factor_label' => 'Late Arrivals',
            'factor_value' => (string) $lateCount,
            'impact_score' => $impact,
            'explanation'  => "Student has {$lateCount} late attendance records during the selected period.",
        ];
    }

    private function calculateGradeAverageImpact(array $gradeStats): array
    {
        $average = $gradeStats['average'];

        if ($average === null) {
            return [
                'factor_name'  => 'grade_average',
                'factor_label' => 'Grade Average',
                'factor_value' => 'No grades',
                'impact_score' => 0,
                'explanation'  => 'No grades available during the selected period.',
            ];
        }

        $impact = match (true) {
            $average < 50 => 25,
            $average < 60 => 15,
            $average < 70 => 8,
            default       => 0,
        };

        return [
            'factor_name'  => 'grade_average',
            'factor_label' => 'Grade Average',
            'factor_value' => $average . '%',
            'impact_score' => $impact,
            'explanation'  => "Student academic average is {$average}% during the selected period.",
        ];
    }

    private function calculateLowGradesImpact(array $gradeStats): array
    {
        $lowGradesCount = $gradeStats['low_grades_count'];

        $impact = match (true) {
            $lowGradesCount >= 3 => 15,
            $lowGradesCount >= 1 => 8,
            default              => 0,
        };

        return [
            'factor_name'  => 'low_grades_count',
            'factor_label' => 'Low Grades Count',
            'factor_value' => (string) $lowGradesCount,
            'impact_score' => $impact,
            'explanation'  => "Student has {$lowGradesCount} grades below 50% during the selected period.",
        ];
    }

    private function calculateFaceRegistrationImpact(Student $student): array
    {
        $impact = $student->face_registered ? 0 : 5;

        return [
            'factor_name'  => 'face_registration',
            'factor_label' => 'Face Profile Registration',
            'factor_value' => $student->face_registered ? 'Registered' : 'Not Registered',
            'impact_score' => $impact,
            'explanation'  => $student->face_registered
                ? 'Student has a registered face profile.'
                : 'Student does not have a registered face profile yet.',
        ];
    }

    private function buildSummary(int $score, RiskLevel $level, array $details): string
    {
        if (empty($details)) {
            return "Student risk is {$level->label()} with score {$score}. No major risk factors detected.";
        }

        $factorLabels = collect($details)
            ->where('impact_score', '>', 0)
            ->pluck('factor_label')
            ->implode(', ');

        return "Student risk is {$level->label()} with score {$score}. Main factors: {$factorLabels}.";
    }

    public function latest(array $filters = []): LengthAwarePaginator
    {
        $latestRiskScoreIds = StudentRiskScore::query()
            ->selectRaw('MAX(id)')
            ->when($filters['school_id'] ?? null, function ($query, int | string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int | string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->groupBy('student_id');

        return StudentRiskScore::query()
            ->with([
                'student:id,student_number,first_name,last_name,status',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'details',
            ])
            ->whereIn('id', $latestRiskScoreIds)
            ->when($filters['level'] ?? null, function ($query, string $level) {
                $query->where('level', $level);
            })
            ->orderByDesc('score')
            ->orderByDesc('calculated_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    public function calculateBulk(array $data): Collection
    {
        $students = Student::query()
            ->where('status', 'active')
            ->when($data['school_id'] ?? null, function ($query, int | string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($data['classroom_id'] ?? null, function ($query, int | string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->get(['id']);

        return $students->map(function (Student $student) use ($data) {
            return $this->calculateForStudent([
                'student_id' => $student->id,
                'date_from'  => $data['date_from'],
                'date_to'    => $data['date_to'],
            ]);
        });
    }
}
