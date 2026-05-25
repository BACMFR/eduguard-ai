<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use App\Services\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function __construct(
        private readonly SubjectService $subjectService
    ) {
    }

    public function index(Request $request)
    {
        $subjects = $this->subjectService->list(
            $request->only([
                'search',
                'is_active',
                'per_page',
            ])
        );

        return SubjectResource::collection($subjects);
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = $this->subjectService->create($request->validated());

        return (new SubjectResource($subject))
            ->additional([
                'message' => 'Subject created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Subject $subject): SubjectResource
    {
        $subject = $this->subjectService->show($subject);

        return new SubjectResource($subject);
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $subject = $this->subjectService->update($subject, $request->validated());

        return (new SubjectResource($subject))
            ->additional([
                'message' => 'Subject updated successfully.',
            ])
            ->response();
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $this->subjectService->delete($subject);

        return response()->json([
            'message' => 'Subject deleted successfully.',
        ]);
    }
}