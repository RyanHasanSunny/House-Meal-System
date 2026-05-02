<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GroceryCatalogItem;
use App\Models\MealPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MealPlanManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_plan_and_generate_member_statuses(): void
    {
        $admin = User::query()->create([
            'name' => 'House Admin',
            'username' => 'house-admin',
            'email' => 'house-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->startOfMonth()->toDateString(),
        ]);

        $member = User::query()->create([
            'name' => 'House Member',
            'username' => 'house-member',
            'email' => 'house-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->startOfMonth()->toDateString(),
        ]);

        Sanctum::actingAs($admin);

        $startDate = Carbon::now()->startOfMonth()->toDateString();
        $endDate = Carbon::now()->endOfMonth()->toDateString();

        $response = $this->postJson('/api/meal-plans', [
            'name' => 'Current Month Meal Plan',
            'type' => 'monthly',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'notes' => 'Monthly meal planning.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Current Month Meal Plan')
            ->assertJsonPath('data.summary.member_count', 2);

        $this->assertDatabaseHas('meal_statuses', [
            'user_id' => $member->id,
            'meal_date' => $startDate,
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        $this->assertDatabaseHas('meal_statuses', [
            'user_id' => $admin->id,
            'meal_date' => $startDate,
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);
    }

    public function test_admin_can_create_exact_seven_day_weekly_plan(): void
    {
        $admin = User::query()->create([
            'name' => 'House Admin',
            'username' => 'weekly-admin',
            'email' => 'weekly-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        User::query()->create([
            'name' => 'House Member',
            'username' => 'weekly-member',
            'email' => 'weekly-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/meal-plans', [
            'name' => 'First June Weekly Plan',
            'type' => 'weekly',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-07',
            'notes' => 'Seven inclusive dates.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.summary.tracked_days', 7)
            ->assertJsonPath('data.summary.totals.taken_meals', 28);
    }

    public function test_admin_can_create_monthly_plan_from_any_start_date_using_month_length(): void
    {
        $admin = User::query()->create([
            'name' => 'House Admin',
            'username' => 'monthly-admin',
            'email' => 'monthly-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        User::query()->create([
            'name' => 'House Member',
            'username' => 'monthly-member',
            'email' => 'monthly-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-10',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/meal-plans', [
            'name' => 'Rolling Monthly Plan',
            'type' => 'monthly',
            'start_date' => '2026-06-10',
            'end_date' => '2026-07-09',
            'notes' => 'Thirty-day monthly cycle from a custom start date.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.start_date', '2026-06-10')
            ->assertJsonPath('data.end_date', '2026-07-09')
            ->assertJsonPath('data.summary.tracked_days', 30);
    }

    public function test_admin_can_add_grocery_item_under_meal_plan(): void
    {
        $admin = User::query()->create([
            'name' => 'Groceries Admin',
            'username' => 'groceries-admin',
            'email' => 'groceries-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'Test Meal Plan',
            'type' => 'custom',
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-20',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        $catalogItem = GroceryCatalogItem::query()->create([
            'name' => 'Lentils',
            'category' => 'Staples',
            'default_unit' => 'kg',
            'sort_order' => 10,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/groceries', [
            'meal_plan_id' => $mealPlan->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'quantity' => 5,
            'price' => 650,
            'purchased_on' => '2026-06-11',
            'notes' => 'Weekly stock',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.meal_plan.id', $mealPlan->id)
            ->assertJsonPath('data.catalog_item.id', $catalogItem->id)
            ->assertJsonPath('data.title', 'Lentils');

        $this->assertDatabaseHas('grocery_items', [
            'meal_plan_id' => $mealPlan->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'title' => 'Lentils',
        ]);
    }
}
