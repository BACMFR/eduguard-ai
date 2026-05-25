<?php

namespace App\Services;

use App\Models\Classroom;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClassroomService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Classroom::query()
            ->with('school:id,name,code')
            ->withCount('students')
            ->when($filters['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($filters['grade_level'] ?? null, function ($query, int|string $gradeLevel) {
                $query->where('grade_level', $gradeLevel);
            })
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('section', 'like', '%' . $search . '%');
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): Classroom
    {
        return Classroom::query()
            ->create($data)
            ->load('school:id,name,code');
    }

    public function show(Classroom $classroom): Classroom
    {
        return $classroom->load([
            'school:id,name,code',
            'students:id,school_id,classroom_id,student_number,first_name,last_name,gender,status',
        ]);
    }

    public function update(Classroom $classroom, array $data): Classroom
    {
        $classroom->update($data);

        return $classroom->fresh()
            ->load('school:id,name,code');
    }

    public function delete(Classroom $classroom): void
    {
        $classroom->delete();
    }
}