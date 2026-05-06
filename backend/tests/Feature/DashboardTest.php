<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GroceryItem;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use App\Services\MealStatusService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_member_dashboard_includes_meal_rate_and_member_meal_cost(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-02 12:00:00', 'Asia/Dhaka'));

        $admin = User::query()->create([
            'name' => 'Dashboard Admin',
            'username' => 'dashboard-admin',
            'email' => 'dashboard-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $member = User::query()->create([
            'name' => 'Dashboard Member',
            'username' => 'dashboard-member',
            'email' => 'dashboard-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'June Weekly Plan',
            'type' => 'custom',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-07',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        app(MealStatusService::class)->syncStatusesForPlan($mealPlan);

        MealStatus::query()
            ->where('user_id', $member->id)
            ->whereDate('meal_date', '2026-06-02')
            ->update(['skip_dinner' => true]);

        GroceryItem::query()->create([
            'meal_plan_id' => $mealPlan->id,
            'member_id' => $admin->id,
            'grocery_catalog_item_id' => null,
            'title' => 'Rice',
            'category' => 'Staples',
            'quantity' => 10,
            'unit' => 'kg',
            'price' => 700,
            'purchased_on' => '2026-06-01',
            'notes' => null,
            'added_by' => $admin->id,
        ]);

        Sanctum::actingAs($member);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'member')
            ->assertJsonPath('data.summary.taken_lunches', 2)
            ->assertJsonPath('data.summary.taken_dinners', 1)
            ->assertJsonPath('data.summary.taken_meals', 3)
            ->assertJsonPath('data.summary.plan_counted_meals', 7)
            ->assertJsonPath('data.summary.counting.counted_days', 2)
            ->assertJsonPath('data.summary.meal_rate', 100)
            ->assertJsonPath('data.summary.meal_cost', 300);
    }

    public function test_admin_dashboard_includes_today_member_lists_for_lunch_and_dinner(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-02 12:00:00', 'Asia/Dhaka'));

        $admin = User::query()->create([
            'name' => 'Dashboard Admin',
            'username' => 'today-admin',
            'email' => 'today-admin@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $member = User::query()->create([
            'name' => 'Dashboard Member',
            'username' => 'today-member',
            'email' => 'today-member@example.com',
            'role' => UserRole::Member->value,
            'password' => 'password123',
            'is_active' => true,
            'joined_at' => '2026-06-01',
        ]);

        $mealPlan = MealPlan::query()->create([
            'name' => 'June Weekly Plan',
            'type' => 'custom',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-07',
            'notes' => null,
            'created_by' => $admin->id,
        ]);

        app(MealStatusService::class)->syncStatusesForPlan($mealPlan);

        MealStatus::query()
            ->where('user_id', $member->id)
            ->whereDate('meal_date', '2026-06-02')
            ->update([
                'skip_dinner' => true,
                'guest_lunches' => 2,
            ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'admin')
            ->assertJsonPath('data.today.lunches', 4)
            ->assertJsonPath('data.today.dinners', 1)
            ->assertJsonPath('data.today.guest_meals', 2)
            ->assertJsonPath('data.today.lunch_members.0.username', 'today-admin')
            ->assertJsonPath('data.today.lunch_members.1.username', 'today-member')
            ->assertJsonPath('data.today.lunch_members.1.guest_meals', 2)
            ->assertJsonPath('data.today.dinner_members.0.username', 'today-admin')
            ->assertJsonCount(1, 'data.today.dinner_members');
    }
}
