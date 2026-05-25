<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DistrictController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $districts = District::query()
            ->with('governorate:id,name')
            ->when($request->governorate_id, function ($query) use ($request) {
                $query->where('governorate_id', $request->governorate_id);
            })
            ->latest()
            ->paginate(20);

        return response()->json($districts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'governorate_id' => ['required', 'exists:governorates,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
        ]);

        $district = District::create($data);

        return response()->json([
            'message' => 'District created successfully.',
            'data' => $district,
        ], 201);
    }

    public function show(District $district): JsonResponse
    {
        return response()->json([
            'data' => $district->load(['governorate', 'schools']),
        ]);
    }

    public function update(Request $request, District $district): JsonResponse
    {
        $data = $request->validate([
            'governorate_id' => ['sometimes', 'required', 'exists:governorates,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
        ]);

        $district->update($data);

        return response()->json([
            'message' => 'District updated successfully.',
            'data' => $district,
        ]);
    }

    public function destroy(District $district): JsonResponse
    {
        $district->delete();

        return response()->json([
            'message' => 'District deleted successfully.',
        ]);
    }
}