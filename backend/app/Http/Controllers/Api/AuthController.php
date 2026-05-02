<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $request->ensureIsNotRateLimited();

        $credentials = $request->validated();
        $user = User::query()->where('username', $credentials['username'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            $request->hitRateLimit();

            return $this->authResponse([
                'message' => 'Invalid username or password.',
            ], 422);
        }

        $request->clearRateLimit();

        if (! $user->is_active) {
            return $this->authResponse([
                'message' => 'Your account is inactive. Please contact an administrator.',
            ], 403);
        }

        $token = $user->createToken($user->username.'-'.now()->timestamp)->plainTextToken;

        return $this->authResponse([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->authResponse([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $payload = $request->validated();
        $payload['email'] = $payload['email'] ?? null;

        $user->fill($payload)->save();

        return $this->authResponse([
            'message' => 'Profile updated successfully.',
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $payload = $request->validated();

        if (! Hash::check($payload['current_password'], $user->password)) {
            return $this->authResponse([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->forceFill([
            'password' => $payload['password'],
        ])->save();

        return $this->authResponse([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->authResponse([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function authResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()
            ->json($payload, $status)
            ->header('Cache-Control', 'no-store, private');
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
