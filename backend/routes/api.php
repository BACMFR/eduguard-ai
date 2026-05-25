<?php

use App\Http\Controllers\Api\AttendanceSessionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CameraAttendanceController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DistrictController;
use App\Http\Controllers\Api\GovernorateController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\Reports\DailyAttendanceReportController;
use App\Http\Controllers\Api\Reports\WeeklyAttendanceReportController;
use App\Http\Controllers\Api\RiskScoreController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\StudentAttendanceHistoryController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentFaceProfileController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'EduGuard Laravel API',
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('permission:manage_users')->group(function () {
        Route::get('users/roles', [UserController::class, 'roles']);
        Route::apiResource('users', UserController::class);
    });

    Route::middleware('user.scope')->group(function () {
        Route::middleware('permission:view_schools')->group(function () {
            Route::apiResource('governorates', GovernorateController::class)
                ->only(['index', 'show']);

            Route::apiResource('districts', DistrictController::class)
                ->only(['index', 'show']);

            Route::apiResource('schools', SchoolController::class)
                ->only(['index', 'show']);
        });

        Route::middleware('permission:manage_schools')->group(function () {
            Route::apiResource('governorates', GovernorateController::class)
                ->except(['index', 'show']);

            Route::apiResource('districts', DistrictController::class)
                ->except(['index', 'show']);

            Route::apiResource('schools', SchoolController::class)
                ->except(['index', 'show']);
        });

        Route::middleware('permission:view_classrooms')->group(function () {
            Route::apiResource('classrooms', ClassroomController::class)
                ->only(['index', 'show']);
        });

        Route::middleware('permission:manage_classrooms')->group(function () {
            Route::apiResource('classrooms', ClassroomController::class)
                ->except(['index', 'show']);
        });

        Route::middleware('permission:view_students')->group(function () {
            Route::apiResource('students', StudentController::class)
                ->only(['index', 'show']);

            Route::apiResource('guardians', GuardianController::class)
                ->only(['index', 'show']);

            Route::get(
                'students/{student}/face-profiles',
                [StudentFaceProfileController::class, 'index']
            );
        });

        Route::middleware('permission:manage_students')->group(function () {
            Route::apiResource('students', StudentController::class)
                ->except(['index', 'show']);

            Route::apiResource('guardians', GuardianController::class)
                ->except(['index', 'show']);

            Route::post(
                'students/{student}/face-profiles',
                [StudentFaceProfileController::class, 'store']
            );

            Route::delete(
                'students/{student}/face-profiles/{faceProfile}',
                [StudentFaceProfileController::class, 'destroy']
            );
        });

        Route::middleware('permission:view_attendance')->group(function () {
            Route::get(
                'students/{student}/attendance-history',
                StudentAttendanceHistoryController::class
            );

            Route::apiResource('attendance-sessions', AttendanceSessionController::class)
                ->only(['index', 'show']);
        });

        Route::middleware('permission:manage_attendance')->group(function () {
            Route::put(
                'attendance-sessions/{attendanceSession}/records/bulk',
                [AttendanceSessionController::class, 'bulkUpdateRecords']
            );

            Route::post(
                'attendance-sessions/camera',
                [CameraAttendanceController::class, 'store']
            );

            Route::apiResource('attendance-sessions', AttendanceSessionController::class)
                ->except(['index', 'show']);
        });

        Route::middleware('permission:view_reports')->group(function () {
            Route::get(
                'reports/weekly-attendance',
                WeeklyAttendanceReportController::class
            );

            Route::get(
                'reports/daily-attendance',
                DailyAttendanceReportController::class
            );
        });

        Route::middleware('permission:view_grades')->group(function () {
            Route::apiResource('subjects', SubjectController::class)
                ->only(['index', 'show']);

            Route::apiResource('grades', GradeController::class)
                ->only(['index', 'show']);
        });

        Route::middleware('permission:manage_grades')->group(function () {
            Route::apiResource('subjects', SubjectController::class)
                ->except(['index', 'show']);

            Route::apiResource('grades', GradeController::class)
                ->except(['index', 'show']);
        });

        Route::middleware('permission:view_risk_scores')->group(function () {
            Route::get('risk-scores/latest', [RiskScoreController::class, 'latest']);
            Route::get('risk-scores', [RiskScoreController::class, 'index']);
            Route::get('risk-scores/{riskScore}', [RiskScoreController::class, 'show']);

            Route::apiResource('interventions', InterventionController::class)
                ->only(['index', 'show']);
        });

        Route::middleware('permission:calculate_risk_scores')->group(function () {
            Route::post('risk-scores/calculate', [RiskScoreController::class, 'calculate']);
            Route::post('risk-scores/calculate-bulk', [RiskScoreController::class, 'calculateBulk']);

            Route::apiResource('interventions', InterventionController::class)
                ->except(['index', 'show']);
        });
    });
});
