<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Risk\CalculateBulkRiskRequest;
use App\Http\Requests\Risk\CalculateStudentRiskRequest;
use App\Http\Requests\Risk\LatestRiskScoresRequest;
use App\Http\Resources\StudentRiskScoreResource;
use App\Models\StudentRiskScore;
use App\Services\RiskScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiskScoreController extends Controller
{
    public function __construct(
        private readonly RiskScoreService $riskScoreService
    ) {
    }

    public function index(Request $request)
    {
        $riskScores = $this->riskScoreService->list(
            $request->only([
                'student_id',
                'school_id',
                'classroom_id',
                'level',
                'per_page',
            ])
        );

        return StudentRiskScoreResource::collection($riskScores);
    }

    public function latest(LatestRiskScoresRequest $request)
    {
        $riskScores = $this->riskScoreService->latest(
            $request->validated()
        );

        return StudentRiskScoreResource::collection($riskScores);
    }

    public function show(StudentRiskScore $riskScore): StudentRiskScoreResource
    {
        return new StudentRiskScoreResource(
            $riskScore->load([
                'student:id,student_number,first_name,last_name,status',
                'school:id,name,code',
                'classroom:id,name,grade_level,section',
                'details',
            ])
        );
    }

    public function calculate(CalculateStudentRiskRequest $request): JsonResponse
    {
        $riskScore = $this->riskScoreService->calculateForStudent(
            $request->validated()
        );

        return (new StudentRiskScoreResource($riskScore))
            ->additional([
                'message' => 'Student risk score calculated successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function calculateBulk(CalculateBulkRiskRequest $request): JsonResponse
    {
        $riskScores = $this->riskScoreService->calculateBulk(
            $request->validated()
        );

        return StudentRiskScoreResource::collection($riskScores)
            ->additional([
                'message' => 'Bulk student risk scores calculated successfully.',
                'count' => $riskScores->count(),
            ])
            ->response()
            ->setStatusCode(201);
    }
}