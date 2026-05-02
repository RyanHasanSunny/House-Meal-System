<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GroceryCatalogItem;
use App\Models\MealPlan;
use App\Models\MemberPayment;
use App\Models\MealStatus;
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
            'unit' => 'kg',
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
            'member_id' => $admin->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'title' => 'Lentils',
        ]);

        $grocery = \App\Models\GroceryItem::query()->firstOrFail();

        $this->assertDatabaseHas('member_payments', [
            'user_id' => $admin->id,
            'grocery_item_id' => $grocery->id,
            'amount' => 650,
        ]);
    }

    public function test_admin_can_add_custom_grocery_item_with_manual_unit(): void
    {
        $admin = User::query()->create([
            'name' => 'Custom Groceries Admin',
            'username' => 'custom-groceries-admin',
            'email' => 'custom-groceries-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'Custom Grocery Plan',
            'type' => 'custom',
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-20',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/groceries', [
            'meal_plan_id' => $mealPlan->id,
            'title' => 'Green Chili',
            'quantity' => 2,
            'unit' => 'kg',
            'price' => 180,
            'purchased_on' => '2026-06-12',
            'notes' => 'Fresh market buy',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.meal_plan.id', $mealPlan->id)
            ->assertJsonPath('data.catalog_item', null)
            ->assertJsonPath('data.title', 'Green Chili')
            ->assertJsonPath('data.unit', 'kg');

        $this->assertDatabaseHas('grocery_items', [
            'meal_plan_id' => $mealPlan->id,
            'member_id' => $admin->id,
            'grocery_catalog_item_id' => null,
            'title' => 'Green Chili',
            'unit' => 'kg',
        ]);
    }

    public function test_super_admin_can_delete_meal_plan_after_typing_exact_name(): void
    {
        $superAdmin = User::query()->create([
            'name' => 'Super Admin',
            'username' => 'super-admin',
            'email' => 'super-admin@example.com',
            'role' => UserRole::SuperAdmin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'Delete Me Plan',
            'type' => 'custom',
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-20',
            'notes' => null,
            'created_by' => $superAdmin->id,
        ]);

        $grocery = \App\Models\GroceryItem::query()->create([
            'meal_plan_id' => $mealPlan->id,
            'member_id' => $superAdmin->id,
            'title' => 'Rice',
            'category' => 'Staples',
            'quantity' => 5,
            'unit' => 'kg',
            'price' => 500,
            'purchased_on' => '2026-06-11',
            'notes' => null,
            'added_by' => $superAdmin->id,
        ]);

        $payment = MemberPayment::query()->create([
            'user_id' => $superAdmin->id,
            'grocery_item_id' => $grocery->id,
            'amount' => 500,
            'paid_on' => '2026-06-11',
            'notes' => 'Grocery payment',
            'recorded_by' => $superAdmin->id,
        ]);

        MealStatus::query()->create([
            'user_id' => $superAdmin->id,
            'meal_plan_id' => $mealPlan->id,
            'meal_date' => '2026-06-11',
            'skip_lunch' => false,
            'skip_dinner' => false,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->deleteJson("/api/meal-plans/{$mealPlan->id}", [
            'confirmation_name' => 'Wrong Name',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('confirmation_name');

        $this->deleteJson("/api/meal-plans/{$mealPlan->id}", [
            'confirmation_name' => 'Delete Me Plan',
        ])->assertOk()
            ->assertJsonPath('message', 'Meal plan deleted successfully.');

        $this->assertDatabaseMissing('meal_plans', ['id' => $mealPlan->id]);
        $this->assertDatabaseMissing('grocery_items', ['id' => $grocery->id]);
        $this->assertDatabaseMissing('member_payments', ['id' => $payment->id]);
        $this->assertDatabaseMissing('meal_statuses', ['meal_plan_id' => $mealPlan->id]);
    }

    public function test_admin_cannot_delete_meal_plan(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'username' => 'admin-delete-check',
            'email' => 'admin-delete-check@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => now()->toDateString(),
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'Protected Plan',
            'type' => 'custom',
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-20',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/meal-plans/{$mealPlan->id}", [
            'confirmation_name' => 'Protected Plan',
        ])->assertForbidden();
    }
}
