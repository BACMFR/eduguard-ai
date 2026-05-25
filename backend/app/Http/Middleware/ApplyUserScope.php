<?php

namespace App\Http\Middleware;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Classroom;
use App\Models\District;
use App\Models\Grade;
use App\Models\Guardian;
use App\Models\Governorate;
use App\Models\Intervention;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentFaceProfile;
use App\Models\StudentRiskScore;
use App\Models\Subject;
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
        $this->validateRequestReferences($request);
        $this->mergeUserScopeIntoRequest($request);

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

            if (! $scope) {
                continue;
            }

            if (! $this->canAccessScope($request, $scope)) {
                abort(403, 'You are not allowed to access this resource.');
            }
        }
    }

    private function validateRequestReferences(Request $request): void
    {
        $this->validateReferencedModel($request, 'school_id', School::class, 'school');
        $this->validateReferencedModel($request, 'classroom_id', Classroom::class, 'classroom');
        $this->validateReferencedModel($request, 'student_id', Student::class, 'student');
        $this->validateReferencedModel($request, 'guardian_id', Guardian::class, 'guardian');
        $this->validateReferencedModel($request, 'attendance_session_id', AttendanceSession::class, 'attendance session');
        $this->validateReferencedModel($request, 'risk_score_id', StudentRiskScore::class, 'risk score');
        $this->validateReferencedModel($request, 'intervention_id', Intervention::class, 'intervention');
    }

    private function validateReferencedModel(Request $request, string $key, string $modelClass, string $label): void
    {
        if (! $request->filled($key)) {
            return;
        }

        $model = $modelClass::query()->find($request->input($key));

        if (! $model) {
            return;
        }

        $scope = $this->extractScopeFromModel($model);

        if (! $scope) {
            return;
        }

        if (! $this->canAccessScope($request, $scope)) {
            abort(403, "You are not allowed to access this {$label}.");
        }
    }

    private function mergeUserScopeIntoRequest(Request $request): void
    {
        $user = $request->user();

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

    private function resolveRouteParameter(string $name, mixed $value): mixed
    {
        if (is_object($value)) {
            return $value;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return match ($name) {
            'governorate' => Governorate::query()->find($value),
            'district' => District::query()->with('governorate')->find($value),
            'school' => School::query()->find($value),
            'classroom' => Classroom::query()->with('school')->find($value),
            'student' => Student::query()->with('school')->find($value),
            'guardian' => Guardian::query()->find($value),
            'attendanceSession' => AttendanceSession::query()->with('school')->find($value),
            'attendanceRecord' => AttendanceRecord::query()
                ->with('attendanceSession.school')
                ->find($value),
            'grade' => Grade::query()->with('school')->find($value),
            'subject' => Subject::query()->find($value),
            'riskScore' => StudentRiskScore::query()->with('school')->find($value),
            'intervention' => Intervention::query()->with('school')->find($value),
            'faceProfile' => StudentFaceProfile::query()->with('student.school')->find($value),
            default => null,
        };
    }

    private function extractScopeFromModel(mixed $model): ?array
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
            $model instanceof StudentRiskScore ||
            $model instanceof Intervention
        ) {
            return $this->scopeFromSchoolId($model->school_id ?? null);
        }

        if ($model instanceof AttendanceRecord) {
            $session = $model->relationLoaded('attendanceSession')
                ? $model->attendanceSession
                : AttendanceSession::query()->find($model->attendance_session_id);

            return $session ? $this->extractScopeFromModel($session) : null;
        }

        if ($model instanceof StudentFaceProfile) {
            $student = $model->relationLoaded('student')
                ? $model->student
                : Student::query()->find($model->student_id);

            return $student ? $this->extractScopeFromModel($student) : null;
        }

        if ($model instanceof Guardian) {
            $student = Student::query()
                ->where('guardian_id', $model->id)
                ->first();

            return $student ? $this->extractScopeFromModel($student) : null;
        }

        /*
         * Subjects are currently global lookup data in the schema and do not
         * have school_id. Route access is controlled by permissions.
         */
        if ($model instanceof Subject) {
            return null;
        }

        return null;
    }

    private function scopeFromSchoolId(?int $schoolId): ?array
    {
        if (! $schoolId) {
            return null;
        }

        $school = School::query()->find($schoolId);

        if (! $school) {
            return [
                'governorate_id' => null,
                'district_id' => null,
                'school_id' => $schoolId,
            ];
        }

        return [
            'governorate_id' => $school->governorate_id,
            'district_id' => $school->district_id,
            'school_id' => $school->id,
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
