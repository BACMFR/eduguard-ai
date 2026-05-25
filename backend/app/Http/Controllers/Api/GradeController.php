<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grade\StoreGradeRequest;
use App\Http\Requests\Grade\UpdateGradeRequest;
use App\Http\Resources\GradeResource;
use App\Models\Grade;
use App\Services\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function __construct(
        private readonly GradeService $gradeService
    ) {
    }

    public function index(Request $request)
    {
        $grades = $this->gradeService->list(
            $request->only([
                'student_id',
                'school_id',
                'classroom_id',
                'subject_id',
                'grade_type',
                'date_from',
                'date_to',
                'per_page',
            ])
        );

        return GradeResource::collection($grades);
    }

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $grade = $this->gradeService->create($request->validated());

        return (new GradeResource($grade))
            ->additional([
                'message' => 'Grade created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Grade $grade): GradeResource
    {
        $grade = $this->gradeService->show($grade);

        return new GradeResource($grade);
    }

    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        $grade = $this->gradeService->update($grade, $request->validated());

        return (new GradeResource($grade))
            ->additional([
                'message' => 'Grade updated successfully.',
            ])
            ->response();
    }

    public function destroy(Grade $grade): JsonResponse
    {
        $this->gradeService->delete($grade);

        return response()->json([
            'message' => 'Grade deleted successfully.',
        ]);
    }
}