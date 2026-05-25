<?php
namespace App\Services;

use App\Models\School;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SchoolService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return School::query()
            ->with(['governorate:id,name', 'district:id,name'])
            ->withCount(['classrooms', 'students'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%');
                });
            })
            ->when($filters['governorate_id'] ?? null, function ($query, int | string $governorateId) {
                $query->where('governorate_id', $governorateId);
            })
            ->when($filters['district_id'] ?? null, function ($query, int | string $districtId) {
                $query->where('district_id', $districtId);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): School
    {
        return School::query()
            ->create($data)
            ->load(['governorate:id,name', 'district:id,name']);
    }

    public function show(School $school): School
    {
        return $school->load([
            'governorate:id,name',
            'district:id,name',
            'classrooms',
            'students.guardian',
        ]);
    }

    public function update(School $school, array $data): School
    {
        $school->update($data);

        return $school->fresh()
            ->load(['governorate:id,name', 'district:id,name']);
    }

    public function delete(School $school): void
    {
        $school->delete();
    }
}
