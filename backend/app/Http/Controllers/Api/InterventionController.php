<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterventionResource;
use App\Models\Intervention;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InterventionController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'classroom_id' => ['nullable', 'integer', 'exists:classrooms,id'],
            'student_id' => ['nullable', 'integer', 'exists:students,id'],
            'status' => ['nullable', 'string', 'max:50'],
            'priority' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $interventions = Intervention::query()
            ->with([
                'student',
                'school',
                'classroom',
                'riskScore',
                'assignedUser',
            ])
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('action_plan', 'like', "%{$search}%")
                        ->orWhereHas('student', function ($studentQuery) use ($search) {
                            $studentQuery
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('student_number', 'like', "%{$search}%");
                        });
                });
            })
            ->when($validated['school_id'] ?? null, function ($query, int|string $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when($validated['classroom_id'] ?? null, function ($query, int|string $classroomId) {
                $query->where('classroom_id', $classroomId);
            })
            ->when($validated['student_id'] ?? null, function ($query, int|string $studentId) {
                $query->where('student_id', $studentId);
            })
            ->when($validated['status'] ?? null, function ($query, string $status) {
                $query->where('status', $status);
            })
            ->when($validated['priority'] ?? null, function ($query, string $priority) {
                $query->where('priority', $priority);
            })
            ->when($validated['type'] ?? null, function ($query, string $type) {
                $query->where('type', $type);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 20);

        return InterventionResource::collection($interventions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'risk_score_id' => ['nullable', 'integer', 'exists:risk_scores,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],

            'type' => [
                'required',
                Rule::in([
                    'counseling',
                    'parent_meeting',
                    'home_visit',
                    'academic_support',
                    'attendance_follow_up',
                    'financial_support',
                    'other',
                ]),
            ],

            'priority' => [
                'required',
                Rule::in(['low', 'medium', 'high', 'critical']),
            ],

            'status' => [
                'required',
                Rule::in(['open', 'in_progress', 'completed', 'cancelled']),
            ],

            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'action_plan' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date'],
            'outcome_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $student = Student::query()
            ->with('classroom')
            ->findOrFail($validated['student_id']);

        $intervention = Intervention::query()->create([
            ...$validated,
            'school_id' => $student->school_id,
            'classroom_id' => $student->classroom_id,
            'completed_at' => $validated['status'] === 'completed' ? now() : null,
        ]);

        $intervention->load([
            'student',
            'school',
            'classroom',
            'riskScore',
            'assignedUser',
        ]);

        return response()->json([
            'message' => 'Intervention created successfully.',
            'data' => new InterventionResource($intervention),
        ], 201);
    }

    public function show(Intervention $intervention): InterventionResource
    {
        $intervention->load([
            'student',
            'school',
            'classroom',
            'riskScore',
            'assignedUser',
        ]);

        return new InterventionResource($intervention);
    }

    public function update(Request $request, Intervention $intervention): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],

            'type' => [
                'sometimes',
                'required',
                Rule::in([
                    'counseling',
                    'parent_meeting',
                    'home_visit',
                    'academic_support',
                    'attendance_follow_up',
                    'financial_support',
                    'other',
                ]),
            ],

            'priority' => [
                'sometimes',
                'required',
                Rule::in(['low', 'medium', 'high', 'critical']),
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in(['open', 'in_progress', 'completed', 'cancelled']),
            ],

            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'action_plan' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date'],
            'outcome_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (($validated['status'] ?? null) === 'completed' && ! $intervention->completed_at) {
            $validated['completed_at'] = now();
        }

        if (($validated['status'] ?? null) !== 'completed') {
            $validated['completed_at'] = null;
        }

        $intervention->update($validated);

        $intervention->load([
            'student',
            'school',
            'classroom',
            'riskScore',
            'assignedUser',
        ]);

        return response()->json([
            'message' => 'Intervention updated successfully.',
            'data' => new InterventionResource($intervention),
        ]);
    }

    public function destroy(Intervention $intervention): JsonResponse
    {
        $intervention->delete();

        return response()->json([
            'message' => 'Intervention deleted successfully.',
        ]);
    }
}