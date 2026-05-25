<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private readonly StudentService $studentService
    ) {
    }

    public function index(Request $request)
    {
        /*
         |--------------------------------------------------------------------------
         | Important for user.scope
         |--------------------------------------------------------------------------
         | ApplyUserScope middleware may merge school_id, district_id, or governorate_id
         | into the request. We pass these filters to StudentService so scoped users
         | only receive allowed students.
         */
        $students = $this->studentService->list(
            $request->only([
                'search',
                'school_id',
                'district_id',
                'governorate_id',
                'classroom_id',
                'guardian_id',
                'status',
                'per_page',
            ])
        );

        return StudentResource::collection($students);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        /*
         |--------------------------------------------------------------------------
         | Important for scoped users
         |--------------------------------------------------------------------------
         | If the logged-in user is scoped to one school, ApplyUserScope will force
         | school_id in the request before validation/controller logic.
         */
        $student = $this->studentService->create($request->validated());

        return (new StudentResource($student))
            ->additional([
                'message' => 'Student created successfully.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Student $student): StudentResource
    {
        /*
         |--------------------------------------------------------------------------
         | Route model binding is already checked by user.scope middleware.
         |--------------------------------------------------------------------------
         | The service should load school, classroom, guardian, etc.
         */
        $student = $this->studentService->show($student);

        return new StudentResource($student);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        /*
         |--------------------------------------------------------------------------
         | Route model binding is already checked by user.scope middleware.
         |--------------------------------------------------------------------------
         | If a scoped user tries to update another school's student, middleware
         | blocks the request before it reaches this method.
         */
        $student = $this->studentService->update($student, $request->validated());

        return (new StudentResource($student))
            ->additional([
                'message' => 'Student updated successfully.',
            ])
            ->response();
    }

    public function destroy(Student $student): JsonResponse
    {
        /*
         |--------------------------------------------------------------------------
         | Route model binding is already checked by user.scope middleware.
         |--------------------------------------------------------------------------
         */
        $this->studentService->delete($student);

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }
}