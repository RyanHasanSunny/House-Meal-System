<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\TransferAdminRoleRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AdminRoleTransfer;
use App\Models\User;
use App\Services\MealStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->orderByRaw("case role when 'super_admin' then 1 when 'admin' then 2 else 3 end")
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users->map(fn (User $user) => $this->userPayload($user))->all(),
        ]);
    }

    public function store(StoreUserRequest $request, MealStatusService $mealStatusService): JsonResponse
    {
        $actor = $request->user();
        $payload = $request->validated();

        if (
            $actor->role->value === UserRole::Admin->value
            && $payload['role'] !== UserRole::Member->value
        ) {
            abort(403, 'Admins can only create member accounts.');
        }

        $payload['email'] = $payload['email'] ?? null;
        $payload['joined_at'] = $payload['joined_at'] ?? now()->toDateString();
        $payload['is_active'] = $payload['is_active'] ?? true;

        $user = User::query()->create($payload);

        if ($mealStatusService->isMealParticipant($user)) {
            $mealStatusService->syncStatusesForUser($user);
        }

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $this->userPayload($user),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        abort(405);
    }

    public function update(UpdateUserRequest $request, User $user, MealStatusService $mealStatusService): JsonResponse
    {
        $actor = $request->user();
        $payload = $request->validated();

        if ($actor->role->value === UserRole::Admin->value) {
            if ($user->role->value !== UserRole::Member->value) {
                abort(403, 'Admins can only update member accounts.');
            }

            if (isset($payload['role']) && $payload['role'] !== UserRole::Member->value) {
                abort(403, 'Admins cannot promote members to higher roles.');
            }
        }

        $payload['email'] = $payload['email'] ?? null;

        if (empty($payload['password'])) {
            unset($payload['password']);
        }

        $user->fill($payload)->save();

        if ($mealStatusService->isMealParticipant($user)) {
            $mealStatusService->syncStatusesForUser($user);
        } else {
            $mealStatusService->pruneFutureStatusesForUser($user);
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $this->userPayload($user->fresh()),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        abort(405);
    }

    public function transferAdminRole(TransferAdminRoleRequest $request, MealStatusService $mealStatusService): JsonResponse
    {
        $actor = $request->user();
        $target = User::query()->findOrFail($request->integer('target_user_id'));

        if ($target->role->value !== UserRole::Member->value || ! $target->is_active) {
            abort(422, 'The next admin must be an active member.');
        }

        $currentAdmin = $actor->role->value === UserRole::Admin->value
            ? $actor
            : User::query()->where('role', UserRole::Admin->value)->whereKeyNot($target->id)->orderBy('name')->first();

        if (! $currentAdmin) {
            abort(422, 'No current admin is available to transfer the role.');
        }

        if ($currentAdmin->id === $target->id) {
            abort(422, 'Choose a different member for the next admin.');
        }

        DB::transaction(function () use ($request, $actor, $currentAdmin, $target): void {
            $currentAdmin->forceFill(['role' => UserRole::Member->value])->save();
            $target->forceFill(['role' => UserRole::Admin->value])->save();

            AdminRoleTransfer::query()->create([
                'from_user_id' => $currentAdmin->id,
                'to_user_id' => $target->id,
                'approved_by_user_id' => $actor->id,
                'effective_on' => today()->toDateString(),
                'notes' => $request->validated()['notes'] ?? null,
            ]);
        });

        $mealStatusService->syncStatusesForUser($currentAdmin->fresh());
        $mealStatusService->syncStatusesForUser($target->fresh());

        return response()->json([
            'message' => 'Admin role transferred successfully.',
            'current_admin' => $this->userPayload($target->fresh()),
            'previous_admin' => $this->userPayload($currentAdmin->fresh()),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'is_active' => $user->is_active,
            'joined_at' => $user->joined_at?->toDateString(),
        ];
    }
}
