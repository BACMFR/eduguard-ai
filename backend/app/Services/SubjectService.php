<?php
namespace App\Services;

use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SubjectService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Subject::query()
            ->withCount('grades')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%');
                });
            })
            ->when(array_key_exists('is_active', $filters), function ($query) use ($filters) {
                $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data): Subject
    {
        return Subject::query()->create($data);
    }

    public function show(Subject $subject): Subject
    {
        return $subject->loadCount('grades');
    }

    public function update(Subject $subject, array $data): Subject
    {
        $subject->update($data);

        return $subject->fresh()->loadCount('grades');
    }

    public function delete(Subject $subject): void
    {
        $subject->delete();
    }
}
