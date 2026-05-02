<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GroceryCatalogItem;
use App\Models\GroceryItem;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\MemberPayment;
use App\Models\User;
use App\Services\MealStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinanceSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_finance_summary_calculates_gross_meal_rate_and_member_balances(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin User',
            'username' => 'finance-admin',
            'email' => 'finance-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $member = User::query()->create([
            'name' => 'Member User',
            'username' => 'finance-member',
            'email' => 'finance-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $catalogItem = GroceryCatalogItem::query()->create([
            'name' => 'Rice',
            'category' => 'Staples',
            'default_unit' => 'kg',
            'sort_order' => 1,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'June Start Plan',
            'type' => 'custom',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-03',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        app(MealStatusService::class)->syncStatusesForPlan($mealPlan);

        MealStatus::query()
            ->where('user_id', $member->id)
            ->whereDate('meal_date', '2026-06-01')
            ->update(['skip_dinner' => true]);

        MealStatus::query()
            ->where('user_id', $member->id)
            ->whereDate('meal_date', '2026-06-02')
            ->update(['skip_lunch' => true]);

        GroceryItem::query()->create([
            'meal_plan_id' => $mealPlan->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'title' => 'Rice',
            'category' => 'Staples',
            'quantity' => 10,
            'unit' => 'kg',
            'price' => 700,
            'purchased_on' => '2026-06-01',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        GroceryItem::query()->create([
            'meal_plan_id' => $mealPlan->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'title' => 'Rice',
            'category' => 'Staples',
            'quantity' => 5,
            'unit' => 'kg',
            'price' => 300,
            'purchased_on' => '2026-06-02',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        MemberPayment::query()->create([
            'user_id' => $admin->id,
            'grocery_item_id' => null,
            'amount' => 200,
            'paid_on' => '2026-06-02',
            'notes' => null,
            'recorded_by' => $admin->id,
        ]);

        MemberPayment::query()->create([
            'user_id' => $member->id,
            'grocery_item_id' => null,
            'amount' => 450,
            'paid_on' => '2026-06-03',
            'notes' => null,
            'recorded_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/finance-summary/monthly?month=2026-06');

        $response
            ->assertOk()
            ->assertJsonPath('data.totals.total_gross', 1000)
            ->assertJsonPath('data.totals.total_members', 2)
            ->assertJsonPath('data.totals.per_head_expense', 500)
            ->assertJsonPath('data.totals.total_meals', 10)
            ->assertJsonPath('data.totals.meal_rate', 100)
            ->assertJsonPath('data.totals.total_paid', 650)
            ->assertJsonPath('data.totals.total_due', 400)
            ->assertJsonCount(2, 'data.members')
            ->assertJsonCount(2, 'data.groceries')
            ->assertJsonPath('data.groceries.0.title', 'Rice')
            ->assertJsonCount(2, 'data.payments');

        $members = collect($response->json('data.members'))->keyBy('user.username');

        $this->assertSame(6, $members['finance-admin']['taken_meals']);
        $this->assertEquals(600.0, $members['finance-admin']['payable_amount']);
        $this->assertEquals(200.0, $members['finance-admin']['paid_amount']);
        $this->assertEquals(400.0, $members['finance-admin']['due_amount']);

        $this->assertSame(4, $members['finance-member']['taken_meals']);
        $this->assertEquals(400.0, $members['finance-member']['payable_amount']);
        $this->assertEquals(450.0, $members['finance-member']['paid_amount']);
        $this->assertEquals(0.0, $members['finance-member']['due_amount']);
        $this->assertEquals(50.0, $members['finance-member']['advance_amount']);
    }

    public function test_member_can_view_monthly_finance_summary(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin User',
            'username' => 'summary-admin',
            'email' => 'summary-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $member = User::query()->create([
            'name' => 'Member User',
            'username' => 'summary-member',
            'email' => 'summary-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $catalogItem = GroceryCatalogItem::query()->create([
            'name' => 'Lentils',
            'category' => 'Staples',
            'default_unit' => 'kg',
            'sort_order' => 1,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'June Summary Plan',
            'type' => 'custom',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-01',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        app(MealStatusService::class)->syncStatusesForPlan($mealPlan);

        GroceryItem::query()->create([
            'meal_plan_id' => $mealPlan->id,
            'grocery_catalog_item_id' => $catalogItem->id,
            'title' => 'Lentils',
            'category' => 'Staples',
            'quantity' => 2,
            'unit' => 'kg',
            'price' => 240,
            'purchased_on' => '2026-06-01',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        Sanctum::actingAs($member);

        $this->getJson('/api/finance-summary/monthly?month=2026-06')
            ->assertOk()
            ->assertJsonPath('data.totals.total_gross', 240)
            ->assertJsonCount(2, 'data.members')
            ->assertJsonCount(1, 'data.groceries')
            ->assertJsonPath('data.groceries.0.title', 'Lentils');
    }

    public function test_monthly_summary_rolls_advance_forward_until_used(): void
    {
        $admin = User::query()->create([
            'name' => 'Advance Admin',
            'username' => 'advance-admin',
            'email' => 'advance-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $member = User::query()->create([
            'name' => 'Advance Member',
            'username' => 'advance-member',
            'email' => 'advance-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-05-01',
        ]);

        $mayPlan = MealPlan::query()->create([
            'name' => 'May End Plan',
            'type' => 'custom',
            'start_date' => '2026-05-31',
            'end_date' => '2026-05-31',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        $junePlan = MealPlan::query()->create([
            'name' => 'June Start Plan',
            'type' => 'custom',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-01',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        app(MealStatusService::class)->syncStatusesForPlan($mayPlan);
        app(MealStatusService::class)->syncStatusesForPlan($junePlan);

        MealStatus::query()
            ->where('user_id', $member->id)
            ->whereDate('meal_date', '2026-05-31')
            ->update(['skip_dinner' => true]);

        GroceryItem::query()->create([
            'meal_plan_id' => $mayPlan->id,
            'grocery_catalog_item_id' => null,
            'title' => 'May Rice',
            'category' => 'Staples',
            'quantity' => 5,
            'unit' => 'kg',
            'price' => 300,
            'purchased_on' => '2026-05-31',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        GroceryItem::query()->create([
            'meal_plan_id' => $junePlan->id,
            'grocery_catalog_item_id' => null,
            'title' => 'June Rice',
            'category' => 'Staples',
            'quantity' => 6,
            'unit' => 'kg',
            'price' => 400,
            'purchased_on' => '2026-06-01',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        MemberPayment::query()->create([
            'user_id' => $member->id,
            'grocery_item_id' => null,
            'amount' => 200,
            'paid_on' => '2026-05-31',
            'notes' => 'Advance from May',
            'recorded_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/finance-summary/monthly?month=2026-06');

        $response
            ->assertOk()
            ->assertJsonPath('data.totals.meal_rate', 100)
            ->assertJsonPath('data.totals.total_paid', 0);

        $members = collect($response->json('data.members'))->keyBy('user.username');

        $this->assertSame(2, $members['advance-member']['taken_meals']);
        $this->assertEquals(200.0, $members['advance-member']['payable_amount']);
        $this->assertEquals(0.0, $members['advance-member']['paid_amount']);
        $this->assertEquals(100.0, $members['advance-member']['carried_advance_amount']);
        $this->assertEquals(100.0, $members['advance-member']['advance_used_amount']);
        $this->assertEquals(100.0, $members['advance-member']['due_amount']);
        $this->assertEquals(0.0, $members['advance-member']['advance_amount']);
    }
}
