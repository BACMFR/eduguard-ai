<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classroom\StoreClassroomRequest;
use App\Http\Requests\Classroom\UpdateClassroomRequest;
use App\Http\Resources\ClassroomResource;
use App\Models\Classroom;
use App\Services\ClassroomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function __construct(
        private readonly ClassroomService $classroomService
    ) {
    }

    public function index(Request $request)
    {
        $classrooms = $this->classroomService->list(
            $request->only([
                'school_id',
                'grade_level',
                'search',
                'per_page',
            ])
        );

        return ClassroomResource::collection($classrooms);
    }

    public function store(StoreClassroomRequest $request): JsonResponse
    {
        $classroom = $this->classroomService->create($request->validated());

        return (new ClassroomResource($classroom))
            ->additional([
                'message' => 'Classroom created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Classroom $classroom): ClassroomResource
    {
        $classroom = $this->classroomService->show($classroom);

        return new ClassroomResource($classroom);
    }

    public function update(UpdateClassroomRequest $request, Classroom $classroom): JsonResponse
    {
        $classroom = $this->classroomService->update($classroom, $request->validated());

        return (new ClassroomResource($classroom))
            ->additional([
                'message' => 'Classroom updated successfully.',
            ])
            ->response();
    }

    public function destroy(Classroom $classroom): JsonResponse
    {
        $this->classroomService->delete($classroom);

        return response()->json([
            'message' => 'Classroom deleted successfully.',
        ]);
    }
}