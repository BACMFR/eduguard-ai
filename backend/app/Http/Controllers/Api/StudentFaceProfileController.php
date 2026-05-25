<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentFaceProfileResource;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Models\StudentFaceProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class StudentFaceProfileController extends Controller
{
    public function index(Student $student): JsonResponse
    {
        $profiles = $student->faceProfiles()
            ->with('registeredBy')
            ->latest()
            ->get();

        return response()->json([
            'data' => StudentFaceProfileResource::collection($profiles),
            'student' => new StudentResource(
                $student->load(['school', 'classroom', 'guardian'])
            ),
        ]);
    }

    public function store(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:5'],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $createdProfileIds = [];

        foreach ($validated['images'] as $image) {
            $aiResult = $this->extractFaceEmbedding($image);

            $path = $image->store(
                'face-profiles/students/' . $student->id,
                'public'
            );

            $profile = StudentFaceProfile::query()->create([
                'student_id' => $student->id,
                'image_path' => $path,
                'status' => 'registered',
                'quality_score' => $aiResult['quality_score'] ?? null,
                'confidence' => $aiResult['confidence'] ?? null,
                'embedding' => $aiResult['embedding'] ?? null,
                'metadata' => [
                    'original_name' => $image->getClientOriginalName(),
                    'mime_type' => $image->getClientMimeType(),
                    'size' => $image->getSize(),
                    'notes' => $validated['notes'] ?? null,
                    'face_count' => $aiResult['face_count'] ?? null,
                    'face_location' => $aiResult['face_location'] ?? null,
                ],
                'registered_by' => $request->user()?->id,
                'registered_at' => now(),
            ]);

            $createdProfileIds[] = $profile->id;
        }

        $student->update([
            'face_registered' => true,
        ]);

        $profiles = StudentFaceProfile::query()
            ->with('registeredBy')
            ->whereIn('id', $createdProfileIds)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Student face profile registered successfully.',
            'data' => StudentFaceProfileResource::collection($profiles),
            'student' => new StudentResource(
                $student->fresh()->load(['school', 'classroom', 'guardian'])
            ),
        ], 201);
    }

    public function destroy(Student $student, StudentFaceProfile $faceProfile): JsonResponse
    {
        if ((int) $faceProfile->student_id !== (int) $student->id) {
            abort(404);
        }

        Storage::disk('public')->delete($faceProfile->image_path);

        $faceProfile->delete();

        $hasProfiles = $student->faceProfiles()->exists();

        $student->update([
            'face_registered' => $hasProfiles,
        ]);

        return response()->json([
            'message' => 'Face profile image deleted successfully.',
            'face_registered' => $hasProfiles,
        ]);
    }

    private function extractFaceEmbedding($image): array
    {
        try {
            $response = Http::timeout(40)
                ->attach(
                    'image',
                    file_get_contents($image->getRealPath()),
                    $image->getClientOriginalName()
                )
                ->post(rtrim(config('services.ai.url'), '/') . '/faces/enroll');

            if ($response->successful()) {
                return $response->json();
            }

            $detail = $response->json('detail')
                ?: $response->json('message')
                ?: 'Unable to extract face embedding.';

            throw ValidationException::withMessages([
                'images' => [$detail],
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'images' => [
                    'AI service is unavailable. Please make sure the AI container is running.',
                ],
            ]);
        }
    }
}