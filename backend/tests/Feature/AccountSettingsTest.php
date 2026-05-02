<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_update_their_own_profile(): void
    {
        $member = User::query()->create([
            'name' => 'Profile Member',
            'username' => 'profile-member',
            'email' => 'profile-member@example.com',
            'phone' => '01700000000',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        Sanctum::actingAs($member);

        $this->patchJson('/api/auth/profile', [
            'name' => 'Updated Member',
            'username' => 'updated-member',
            'email' => 'updated-member@example.com',
            'phone' => '01800000000',
        ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Member')
            ->assertJsonPath('user.username', 'updated-member')
            ->assertJsonPath('user.email', 'updated-member@example.com')
            ->assertJsonPath('user.phone', '01800000000');

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'name' => 'Updated Member',
            'username' => 'updated-member',
            'email' => 'updated-member@example.com',
            'phone' => '01800000000',
        ]);
    }

    public function test_member_can_update_their_password_with_the_correct_current_password(): void
    {
        $member = User::query()->create([
            'name' => 'Password Member',
            'username' => 'password-member',
            'email' => 'password-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        Sanctum::actingAs($member);

        $this->patchJson('/api/auth/password', [
            'current_password' => 'password123',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Password updated successfully.');

        $member->refresh();

        $this->assertTrue(Hash::check('new-password123', $member->password));
    }

    public function test_password_update_requires_the_correct_current_password(): void
    {
        $member = User::query()->create([
            'name' => 'Wrong Password Member',
            'username' => 'wrong-password-member',
            'email' => 'wrong-password-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        Sanctum::actingAs($member);

        $this->patchJson('/api/auth/password', [
            'current_password' => 'not-the-current-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Current password is incorrect.');

        $member->refresh();

        $this->assertTrue(Hash::check('password123', $member->password));
    }
}
