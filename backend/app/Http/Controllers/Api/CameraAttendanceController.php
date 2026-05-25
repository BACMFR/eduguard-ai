<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CameraAttendanceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id'     => ['required', 'integer', 'exists:schools,id'],
            'classroom_id'  => ['required', 'integer', 'exists:classrooms,id'],
            'session_date'  => ['required', 'date'],
            'start_time'    => ['nullable', 'date_format:H:i'],
            'end_time'      => ['nullable', 'date_format:H:i'],
            'notes'         => ['nullable', 'string', 'max:1000'],

            'camera_source' => ['required', Rule::in(['ip_webcam', 'browser'])],

            'ip_camera_url' => [
                'nullable',
                'required_if:camera_source,ip_webcam',
                'url',
                'max:500',
            ],

            'image'         => [
                'nullable',
                'required_if:camera_source,browser',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],
        ]);

        $classroom = Classroom::query()
            ->where('id', $validated['classroom_id'])
            ->where('school_id', $validated['school_id'])
            ->firstOrFail();

        $students = Student::query()
            ->with([
                'faceProfiles' => function ($query) {
                    $query
                        ->where('status', 'registered')
                        ->whereNotNull('embedding');
                },
            ])
            ->where('school_id', $validated['school_id'])
            ->where('classroom_id', $classroom->id)
            ->where('status', 'active')
            ->orderBy('id')
            ->get();

        if ($students->isEmpty()) {
            return response()->json([
                'message' => 'No active students found in this classroom.',
            ], 422);
        }

        $capture = $this->captureImage($request, $validated);

        $aiMatches = $this->recognizeStudents(
            $capture['binary'],
            $capture['filename'],
            $students
        );

        $notes = trim(($validated['notes'] ?? '') . "\nCamera capture: " . $capture['path']);

        if (($validated['camera_source'] ?? null) === 'ip_webcam') {
            $notes .= "\nSource: IP Webcam";
        } else {
            $notes .= "\nSource: Browser Camera";
        }

        $session = AttendanceSession::query()->create([
            'school_id'    => $validated['school_id'],
            'classroom_id' => $validated['classroom_id'],
            'session_date' => $validated['session_date'],
            'start_time'   => $validated['start_time'] ?? now()->format('H:i'),
            'end_time'     => $validated['end_time'] ?? now()->addMinutes(15)->format('H:i'),
            'source'       => 'camera',
            'status'       => 'draft',
            'notes'        => $notes,
        ]);

        $matchesByStudentId = collect($aiMatches)
            ->filter(fn($match) => isset($match['student_id']))
            ->keyBy(fn($match) => (int) $match['student_id']);

        foreach ($students as $student) {
            $match = $matchesByStudentId->get((int) $student->id);

            AttendanceRecord::query()->create([
                'attendance_session_id' => $session->id,
                'student_id'            => $student->id,
                'status'                => $match ? 'present' : 'absent',
                'detection_method'      => 'system',
                'confidence'            => $match['confidence'] ?? null,
                'review_status'         => 'pending',
                'notes'                 => $match
                    ? 'Detected by camera attendance.'
                    : 'Not detected by camera attendance.',
            ]);
        }

        $session->load([
            'school',
            'classroom',
            'records.student',
        ]);

        return response()->json([
            'message' => 'Camera attendance session created successfully.',
            'data'    => new AttendanceSessionResource($session),
            'capture' => [
                'path'   => $capture['path'],
                'url'    => Storage::disk('public')->url($capture['path']),
                'source' => $validated['camera_source'],
            ],
            'ai'      => [
                'detected_count' => count($aiMatches),
                'matches'        => $aiMatches,
            ],
        ], 201);
    }

    private function captureImage(Request $request, array $validated): array
    {
        if ($validated['camera_source'] === 'browser') {
            $image = $request->file('image');

            $binary = file_get_contents($image->getRealPath());

            $path = $image->store(
                'attendance-captures/' . $validated['session_date'],
                'public'
            );

            return [
                'binary'   => $binary,
                'filename' => $image->getClientOriginalName() ?: 'browser-camera.jpg',
                'path'     => $path,
            ];
        }

        $url = $validated['ip_camera_url'];

        try {
            $response = Http::timeout(12)->get($url);
        } catch (\Throwable $exception) {
            report($exception);

            abort(422, 'Unable to connect to IP Webcam. Make sure the phone and laptop are on the same Wi-Fi network.');
        }

        if (! $response->successful()) {
            abort(422, 'Unable to capture image from IP Webcam URL.');
        }

        $contentType = strtolower($response->header('Content-Type', 'image/jpeg'));

        if (! str_starts_with($contentType, 'image/')) {
            abort(422, 'The IP Webcam URL must return an image. Use /shot.jpg, not /video.');
        }

        $extension = 'jpg';

        if (str_contains($contentType, 'png')) {
            $extension = 'png';
        }

        if (str_contains($contentType, 'webp')) {
            $extension = 'webp';
        }

        $binary = $response->body();

        $path = 'attendance-captures/' .
        $validated['session_date'] .
        '/ip-webcam-' .
        Str::uuid() .
            '.' .
            $extension;

        Storage::disk('public')->put($path, $binary);

        return [
            'binary'   => $binary,
            'filename' => 'ip-webcam.' . $extension,
            'path'     => $path,
        ];
    }

    private function recognizeStudents(string $imageBinary, string $filename, $students): array
    {
        try {
            $roster = $students->map(function (Student $student) {
                return [
                    'id'              => $student->id,
                    'student_number'  => $student->student_number,
                    'full_name'       => $student->full_name,
                    'face_registered' => (bool) $student->face_registered,

                    'face_profiles'   => $student->faceProfiles
                        ->map(function ($profile) {
                            return [
                                'id'        => $profile->id,
                                'embedding' => $profile->embedding,
                            ];
                        })
                        ->values()
                        ->toArray(),
                ];
            })->values()->toArray();

            $response = Http::timeout(20)
                ->attach('image', $imageBinary, $filename)
                ->post(rtrim(config('services.ai.url'), '/') . '/attendance/recognize', [
                    'students' => json_encode($roster),
                ]);

            if (! $response->successful()) {
                return [];
            }

            return $response->json('matches', []);
        } catch (\Throwable $exception) {
            report($exception);

            return [];
        }
    }
}
