<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StoreSchoolRequest;
use App\Http\Requests\School\UpdateSchoolRequest;
use App\Http\Resources\SchoolResource;
use App\Models\School;
use App\Services\SchoolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function __construct(
        private readonly SchoolService $schoolService
    ) {
    }

    public function index(Request $request)
    {
        $schools = $this->schoolService->list(
            $request->only([
                'search',
                'governorate_id',
                'district_id',
                'per_page',
            ])
        );

        return SchoolResource::collection($schools);
    }

    public function store(StoreSchoolRequest $request): JsonResponse
    {
        $school = $this->schoolService->create($request->validated());

        return (new SchoolResource($school))
            ->additional([
                'message' => 'School created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(School $school): SchoolResource
    {
        $school = $this->schoolService->show($school);

        return new SchoolResource($school);
    }

    public function update(UpdateSchoolRequest $request, School $school): JsonResponse
    {
        $school = $this->schoolService->update($school, $request->validated());

        return (new SchoolResource($school))
            ->additional([
                'message' => 'School updated successfully.',
            ])
            ->response();
    }

    public function destroy(School $school): JsonResponse
    {
        $this->schoolService->delete($school);

        return response()->json([
            'message' => 'School deleted successfully.',
        ]);
    }
}