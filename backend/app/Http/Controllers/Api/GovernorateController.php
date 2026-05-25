<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Governorate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GovernorateController extends Controller
{
    public function index(): JsonResponse
    {
        $governorates = Governorate::query()
            ->withCount(['districts', 'schools'])
            ->latest()
            ->paginate(20);

        return response()->json($governorates);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:governorates,code'],
        ]);

        $governorate = Governorate::create($data);

        return response()->json([
            'message' => 'Governorate created successfully.',
            'data' => $governorate,
        ], 201);
    }

    public function show(Governorate $governorate): JsonResponse
    {
        return response()->json([
            'data' => $governorate->load(['districts', 'schools']),
        ]);
    }

    public function update(Request $request, Governorate $governorate): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:governorates,code,' . $governorate->id],
        ]);

        $governorate->update($data);

        return response()->json([
            'message' => 'Governorate updated successfully.',
            'data' => $governorate,
        ]);
    }

    public function destroy(Governorate $governorate): JsonResponse
    {
        $governorate->delete();

        return response()->json([
            'message' => 'Governorate deleted successfully.',
        ]);
    }
}