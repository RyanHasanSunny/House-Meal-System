<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MealStatusUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_member_can_skip_dinner_after_lunch_cutoff_but_cannot_skip_lunch(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 15:00:00', 'Asia/Dhaka'));

        $member = User::query()->create([
            'name' => 'Meal Member',
            'username' => 'meal-member',
            'email' => 'meal-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $member->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'skip_lunch' => true,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Lunch skip time has passed.');

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'skip_dinner' => true,
        ])->assertOk()
            ->assertJsonPath('data.skip_dinner', true);
    }

    public function test_member_cannot_skip_dinner_after_dinner_cutoff(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 21:30:00', 'Asia/Dhaka'));

        $member = User::query()->create([
            'name' => 'Late Member',
            'username' => 'late-member',
            'email' => 'late-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $member->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'skip_dinner' => true,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Dinner skip time has passed.');
    }

    public function test_member_can_add_guest_meals_up_to_three_before_cutoff(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 12:00:00', 'Asia/Dhaka'));

        $member = User::query()->create([
            'name' => 'Guest Host',
            'username' => 'guest-host',
            'email' => 'guest-host@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $member->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'guest_lunches' => 3,
        ])->assertOk()
            ->assertJsonPath('data.guest_lunches', 3)
            ->assertJsonPath('data.lunch_meals', 4)
            ->assertJsonPath('data.guest_meals', 3)
            ->assertJsonPath('data.total_meals', 5);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'guest_lunches' => 4,
        ])->assertStatus(422)
            ->assertJsonValidationErrors('guest_lunches');
    }

    public function test_member_cannot_add_lunch_guest_meals_after_lunch_cutoff(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 15:00:00', 'Asia/Dhaka'));

        $member = User::query()->create([
            'name' => 'Late Guest Host',
            'username' => 'late-guest-host',
            'email' => 'late-guest-host@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $member->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'guest_lunches' => 1,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Lunch guest meal time has passed.');
    }

    public function test_meal_status_ownership_check_handles_numeric_string_user_ids(): void
    {
        $member = new User();
        $member->id = 42;

        $status = new MealStatus();
        $status->user_id = '42';

        $this->assertTrue($status->belongsToUser($member));
    }

    public function test_super_admin_can_update_a_members_meal_status(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 12:00:00', 'Asia/Dhaka'));

        $superAdmin = User::query()->create([
            'name' => 'House Owner',
            'username' => 'house-owner',
            'email' => 'house-owner@example.com',
            'role' => UserRole::SuperAdmin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $member = User::query()->create([
            'name' => 'Target Member',
            'username' => 'target-member',
            'email' => 'target-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $superAdmin->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'skip_lunch' => true,
        ])->assertOk()
            ->assertJsonPath('data.skip_lunch', true);
    }

    public function test_admin_cannot_update_another_members_meal_status(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-05-02 12:00:00', 'Asia/Dhaka'));

        $admin = User::query()->create([
            'name' => 'House Admin',
            'username' => 'house-admin',
            'email' => 'house-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $member = User::query()->create([
            'name' => 'Target Member',
            'username' => 'target-member-two',
            'email' => 'target-member-two@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        $status = MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/meal-statuses/{$status->id}", [
            'skip_lunch' => true,
        ])->assertStatus(403)
            ->assertJsonPath('message', 'You can only update your own meal status.');
    }

    public function test_super_admin_can_view_a_members_meal_statuses_by_user_id(): void
    {
        $superAdmin = User::query()->create([
            'name' => 'House Owner',
            'username' => 'status-owner',
            'email' => 'status-owner@example.com',
            'role' => UserRole::SuperAdmin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $member = User::query()->create([
            'name' => 'Visible Member',
            'username' => 'visible-member',
            'email' => 'visible-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'May Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-07',
            'notes' => null,
            'created_by' => $superAdmin->id,
        ]);

        MealStatus::query()->create([
            'user_id' => $member->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-05-02',
            'skip_lunch' => false,
            'skip_dinner' => true,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->getJson("/api/meal-statuses?user_id={$member->id}&meal_plan_id={$mealPlan->id}")
            ->assertOk()
            ->assertJsonPath('meta.selected_user.id', $member->id)
            ->assertJsonPath('data.0.skip_dinner', true);
    }
}
