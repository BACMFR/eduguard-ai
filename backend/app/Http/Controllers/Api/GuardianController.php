<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuardianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $guardians = Guardian::query()
            ->withCount('students')
            ->when($request->search, function ($query) use ($request) {
                $query->where('full_name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%')
                    ->orWhere('national_id', 'like', '%' . $request->search . '%');
            })
            ->latest()
            ->paginate(20);

        return response()->json($guardians);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:guardians,national_id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'relationship' => ['required', Rule::in(['father', 'mother', 'brother', 'sister', 'relative', 'other'])],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $guardian = Guardian::create($data);

        return response()->json([
            'message' => 'Guardian created successfully.',
            'data' => $guardian,
        ], 201);
    }

    public function show(Guardian $guardian): JsonResponse
    {
        return response()->json([
            'data' => $guardian->load('students.school', 'students.classroom'),
        ]);
    }

    public function update(Request $request, Guardian $guardian): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:guardians,national_id,' . $guardian->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'relationship' => ['sometimes', 'required', Rule::in(['father', 'mother', 'brother', 'sister', 'relative', 'other'])],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $guardian->update($data);

        return response()->json([
            'message' => 'Guardian updated successfully.',
            'data' => $guardian,
        ]);
    }

    public function destroy(Guardian $guardian): JsonResponse
    {
        $guardian->delete();

        return response()->json([
            'message' => 'Guardian deleted successfully.',
        ]);
    }
}