<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $users = User::query()
            ->with(['governorate', 'district', 'school'])
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($validated['role'] ?? null, function ($query, string $role) {
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->when($validated['school_id'] ?? null, function ($query, int $schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->when(array_key_exists('is_active', $validated), function ($query) use ($validated) {
                $query->where('is_active', (bool) $validated['is_active']);
            })
            ->latest()
            ->paginate($perPage);

        return UserResource::collection($users);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['governorate', 'district', 'school']);

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],

            'password' => ['required', 'string', 'min:8'],

            'role' => [
                'required',
                'string',
                Rule::exists('roles', 'name')->where('guard_name', 'sanctum'),
            ],

            'governorate_id' => ['nullable', 'integer', 'exists:governorates,id'],
            'district_id' => ['nullable', 'integer', 'exists:districts,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'is_active' => ['required', 'boolean'],
        ]);

        $role = $validated['role'];
        unset($validated['role']);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $user->syncRoles([$role]);

        $user->load(['governorate', 'district', 'school']);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User created successfully.',
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'password' => ['nullable', 'string', 'min:8'],

            'role' => [
                'sometimes',
                'required',
                'string',
                Rule::exists('roles', 'name')->where('guard_name', 'sanctum'),
            ],

            'governorate_id' => ['nullable', 'integer', 'exists:governorates,id'],
            'district_id' => ['nullable', 'integer', 'exists:districts,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $role = $validated['role'] ?? null;
        unset($validated['role']);

        if (array_key_exists('password', $validated)) {
            if ($validated['password']) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }
        }

        $user->update($validated);

        if ($role) {
            $user->syncRoles([$role]);
        }

        $user->load(['governorate', 'district', 'school']);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User updated successfully.',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::query()
            ->where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get()
            ->map(function (Role $role) {
                return [
                    'name' => $role->name,
                    'label' => str($role->name)->replace('_', ' ')->title()->toString(),
                ];
            })
            ->values();

        return response()->json([
            'data' => $roles,
        ]);
    }
}