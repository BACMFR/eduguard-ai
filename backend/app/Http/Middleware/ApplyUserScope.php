<?php

namespace App\Http\Middleware;

use App\Models\AttendanceSession;
use App\Models\Classroom;
use App\Models\District;
use App\Models\Grade;
use App\Models\Governorate;
use App\Models\RiskScore;
use App\Models\School;
use App\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyUserScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($this->isGlobalUser($user)) {
            return $next($request);
        }

        if (! $user->school_id && ! $user->district_id && ! $user->governorate_id) {
            abort(403, 'This user does not have an access scope assigned.');
        }

        $this->validateRouteParameters($request);
        $this->validateAndMergeRequestScope($request);

        return $next($request);
    }

    private function isGlobalUser($user): bool
    {
        return $user->hasAnyRole(['super_admin', 'ministry_admin'])
            && ! $user->school_id
            && ! $user->district_id
            && ! $user->governorate_id;
    }

    private function validateRouteParameters(Request $request): void
    {
        foreach ($request->route()?->parameters() ?? [] as $name => $value) {
            $model = $this->resolveRouteParameter($name, $value);

            if (! $model) {
                continue;
            }

            $scope = $this->extractScopeFromModel($model);

            if (! $this->canAccessScope($request, $scope)) {
                abort(403, 'You are not allowed to access this resource.');
            }
        }
    }

    private function validateAndMergeRequestScope(Request $request): void
    {
        $user = $request->user();

        $this->validateRequestedSchool($request);
        $this->validateRequestedClassroom($request);
        $this->validateRequestedStudent($request);

        if ($user->school_id) {
            $this->ensureSameValue($request, 'school_id', $user->school_id);
            $request->merge([
                'school_id' => $user->school_id,
            ]);

            return;
        }

        if ($user->district_id) {
            $this->ensureSameValue($request, 'district_id', $user->district_id);
            $request->merge([
                'district_id' => $user->district_id,
            ]);

            return;
        }

        if ($user->governorate_id) {
            $this->ensureSameValue($request, 'governorate_id', $user->governorate_id);
            $request->merge([
                'governorate_id' => $user->governorate_id,
            ]);
        }
    }

    private function ensureSameValue(Request $request, string $key, int $allowedValue): void
    {
        if (! $request->filled($key)) {
            return;
        }

        if ((int) $request->input($key) !== $allowedValue) {
            abort(403, 'You are not allowed to use this access scope.');
        }
    }

    private function validateRequestedSchool(Request $request): void
    {
        if (! $request->filled('school_id')) {
            return;
        }

        $school = School::query()->find($request->integer('school_id'));

        if (! $school) {
            return;
        }

        $scope = $this->extractScopeFromModel($school);

        if (! $this->canAccessScope($request, $scope)) {
            abort(403, 'You are not allowed to access this school.');
        }
    }

    private function validateRequestedClassroom(Request $request): void
    {
        if (! $request->filled('classroom_id')) {
            return;
        }

        $classroom = Classroom::query()
            ->with('school')
            ->find($request->integer('classroom_id'));

        if (! $classroom) {
            return;
        }

        $scope = $this->extractScopeFromModel($classroom);

        if (! $this->canAccessScope($request, $scope)) {
            abort(403, 'You are not allowed to access this classroom.');
        }
    }

    private function validateRequestedStudent(Request $request): void
    {
        if (! $request->filled('student_id')) {
            return;
        }

        $student = Student::query()
            ->with('school')
            ->find($request->integer('student_id'));

        if (! $student) {
            return;
        }

        $scope = $this->extractScopeFromModel($student);

        if (! $this->canAccessScope($request, $scope)) {
            abort(403, 'You are not allowed to access this student.');
        }
    }

    private function resolveRouteParameter(string $name, mixed $value): mixed
    {
        if (is_object($value)) {
            return $value;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return match ($name) {
            'school' => School::query()->find($value),

            'district' => District::query()
                ->with('governorate')
                ->find($value),

            'governorate' => Governorate::query()->find($value),

            'classroom' => Classroom::query()
                ->with('school')
                ->find($value),

            'student' => Student::query()
                ->with('school')
                ->find($value),

            'attendanceSession' => AttendanceSession::query()
                ->with('school')
                ->find($value),

            'grade' => Grade::query()
                ->with('school')
                ->find($value),

            'riskScore' => RiskScore::query()
                ->with('school')
                ->find($value),

            default => null,
        };
    }

    private function extractScopeFromModel(mixed $model): array
    {
        if ($model instanceof Governorate) {
            return [
                'governorate_id' => $model->id,
                'district_id' => null,
                'school_id' => null,
            ];
        }

        if ($model instanceof District) {
            return [
                'governorate_id' => $model->governorate_id,
                'district_id' => $model->id,
                'school_id' => null,
            ];
        }

        if ($model instanceof School) {
            return [
                'governorate_id' => $model->governorate_id,
                'district_id' => $model->district_id,
                'school_id' => $model->id,
            ];
        }

        if (
            $model instanceof Classroom ||
            $model instanceof Student ||
            $model instanceof AttendanceSession ||
            $model instanceof Grade ||
            $model instanceof RiskScore
        ) {
            $schoolId = $model->school_id ?? null;
            $school = $model->relationLoaded('school')
                ? $model->school
                : ($schoolId ? School::query()->find($schoolId) : null);

            return [
                'governorate_id' => $school?->governorate_id,
                'district_id' => $school?->district_id,
                'school_id' => $school?->id ?? $schoolId,
            ];
        }

        return [
            'governorate_id' => null,
            'district_id' => null,
            'school_id' => null,
        ];
    }

    private function canAccessScope(Request $request, array $scope): bool
    {
        $user = $request->user();

        if ($user->school_id) {
            return (int) ($scope['school_id'] ?? 0) === (int) $user->school_id;
        }

        if ($user->district_id) {
            return (int) ($scope['district_id'] ?? 0) === (int) $user->district_id;
        }

        if ($user->governorate_id) {
            return (int) ($scope['governorate_id'] ?? 0) === (int) $user->governorate_id;
        }

        return false;
    }
}