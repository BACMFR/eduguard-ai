<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Student::query()
            ->with([
                'school:id,name,code,governorate_id,district_id',
                'classroom:id,school_id,name,grade_level,section',
                'guardian:id,full_name,national_id,relationship,phone,email,address',
            ])

            /*
            |--------------------------------------------------------------------------
            | Search
            |--------------------------------------------------------------------------
            */
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('first_name', 'like', '%' . $search . '%')
                        ->orWhere('last_name', 'like', '%' . $search . '%')
                        ->orWhere('student_number', 'like', '%' . $search . '%')
                        ->orWhere('national_id', 'like', '%' . $search . '%');
                });
            })

            /*
            |--------------------------------------------------------------------------
            | User Scope Filters
            |--------------------------------------------------------------------------
            | ApplyUserScope middleware may inject school_id, district_id,
            | or governorate_id into the request. These filters make sure
            | scoped users only receive students inside their allowed scope.
            */
            ->when($filters['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })

            ->when($filters['district_id'] ?? null, function ($query, int|string $districtId) {
                $query->whereHas('school', function ($schoolQuery) use ($districtId) {
                    $schoolQuery->where('district_id', $districtId);
                });
            })

            ->when($filters['governorate_id'] ?? null, function ($query, int|string $governorateId) {
                $query->whereHas('school', function ($schoolQuery) use ($governorateId) {
                    $schoolQuery->where('governorate_id', $governorateId);
                });
            })

            /*
            |--------------------------------------------------------------------------
            | Page Filters
            |--------------------------------------------------------------------------
            */
            ->when($filters['classroom_id'] ?? null, function ($query, int|string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })

            ->when($filters['guardian_id'] ?? null, function ($query, int|string $guardianId) {
                $query->where('guardian_id', $guardianId);
            })

            ->when($filters['status'] ?? null, function ($query, string $status) {
                $query->where('status', $status);
            })

            ->latest()
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): Student
    {
        if (! isset($data['status'])) {
            $data['status'] = 'active';
        }

        return Student::query()
            ->create($data)
            ->load([
                'school:id,name,code,governorate_id,district_id',
                'classroom:id,school_id,name,grade_level,section',
                'guardian:id,full_name,national_id,relationship,phone,email,address',
            ]);
    }

    public function show(Student $student): Student
    {
        return $student->load([
            'school:id,name,code,governorate_id,district_id',
            'classroom:id,school_id,name,grade_level,section',
            'guardian:id,full_name,national_id,relationship,phone,email,address',
        ]);
    }

    public function update(Student $student, array $data): Student
    {
        $student->update($data);

        return $student->fresh()
            ->load([
                'school:id,name,code,governorate_id,district_id',
                'classroom:id,school_id,name,grade_level,section',
                'guardian:id,full_name,national_id,relationship,phone,email,address',
            ]);
    }

    public function delete(Student $student): void
    {
        $student->delete();
    }
}