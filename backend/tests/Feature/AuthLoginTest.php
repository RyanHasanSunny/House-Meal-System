<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\MealPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_username_and_password(): void
    {
        $user = User::query()->create([
            'name' => 'Admin User',
            'username' => 'admin-user',
            'email' => 'admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => $user->username,
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.username', 'admin-user');

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_login_is_rate_limited_after_too_many_failed_attempts(): void
    {
        $user = User::query()->create([
            'name' => 'Limited User',
            'username' => 'limited-user',
            'email' => 'limited@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', [
                'username' => $user->username,
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ])
            ->assertStatus(429)
            ->assertJsonValidationErrors('username');
    }

    public function test_security_headers_are_present_on_public_auth_responses(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'username' => 'missing-user',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_admin_role_can_be_transferred_to_active_member(): void
    {
        $admin = User::query()->create([
            'name' => 'Current Admin',
            'username' => 'current-admin',
            'email' => 'current-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $member = User::query()->create([
            'name' => 'Target Member',
            'username' => 'target-member',
            'email' => 'target-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        MealPlan::query()->create([
            'name' => 'Current Weekly Plan',
            'type' => 'weekly',
            'start_date' => now()->startOfWeek()->toDateString(),
            'end_date' => now()->startOfWeek()->addDays(6)->toDateString(),
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this
            ->postJson('/api/users/transfer-admin', [
                'target_user_id' => $member->id,
                'notes' => 'Weekly handoff',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('current_admin.id', $member->id)
            ->assertJsonPath('previous_admin.id', $admin->id);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'role' => UserRole::Member->value,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'role' => UserRole::Admin->value,
        ]);

        $this->assertDatabaseHas('admin_role_transfers', [
            'from_user_id' => $admin->id,
            'to_user_id' => $member->id,
        ]);

        $this->assertDatabaseHas('meal_statuses', [
            'user_id' => $member->id,
            'meal_date' => now()->toDateString(),
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);
    }
}
