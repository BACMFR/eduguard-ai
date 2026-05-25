<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GradeService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Grade::query()
            ->with([
                'student:id,student_number,first_name,last_name',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'subject:id,name,code',
            ])
            ->when($filters['student_id'] ?? null, function ($query, int|string $studentId) {
                $query->where('student_id', $studentId);
            })
            ->when($filters['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['classroom_id'] ?? null, function ($query, int|string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->when($filters['subject_id'] ?? null, function ($query, int|string $subjectId) {
                $query->where('subject_id', $subjectId);
            })
            ->when($filters['grade_type'] ?? null, function ($query, string $gradeType) {
                $query->where('grade_type', $gradeType);
            })
            ->when($filters['date_from'] ?? null, function ($query, string $dateFrom) {
                $query->whereDate('exam_date', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function ($query, string $dateTo) {
                $query->whereDate('exam_date', '<=', $dateTo);
            })
            ->latest('exam_date')
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): Grade
    {
        $student = Student::query()->findOrFail($data['student_id']);

        $data['school_id'] = $student->school_id;
        $data['classroom_id'] = $student->classroom_id;

        return Grade::query()
            ->create($data)
            ->load([
                'student:id,student_number,first_name,last_name',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'subject:id,name,code',
            ]);
    }

    public function show(Grade $grade): Grade
    {
        return $grade->load([
            'student:id,student_number,first_name,last_name',
            'school:id,name,code',
            'classroom:id,name,grade_level,section',
            'subject:id,name,code',
        ]);
    }

    public function update(Grade $grade, array $data): Grade
    {
        if (isset($data['student_id'])) {
            $student = Student::query()->findOrFail($data['student_id']);

            $data['school_id'] = $student->school_id;
            $data['classroom_id'] = $student->classroom_id;
        }

        $grade->update($data);

        return $grade->fresh()
            ->load([
                'student:id,student_number,first_name,last_name',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'subject:id,name,code',
            ]);
    }

    public function delete(Grade $grade): void
    {
        $grade->delete();
    }
}