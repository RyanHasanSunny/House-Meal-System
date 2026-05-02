<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\GroceryItem;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use App\Services\MealStatusService;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(MealStatusService $mealStatusService): void
    {
        $superAdmin = User::query()->updateOrCreate(
            ['username' => 'superadmin'],
            [
                'name' => 'House Super Admin',
                'email' => 'superadmin@house.local',
                'phone' => '01700000001',
                'role' => UserRole::SuperAdmin->value,
                'password' => 'password123',
                'is_active' => true,
                'joined_at' => Carbon::now()->startOfMonth()->toDateString(),
            ]
        );

        $admin = User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'House Admin',
                'email' => 'admin@house.local',
                'phone' => '01700000002',
                'role' => UserRole::Admin->value,
                'password' => 'password123',
                'is_active' => true,
                'joined_at' => Carbon::now()->startOfMonth()->toDateString(),
            ]
        );

        $memberOne = User::query()->updateOrCreate(
            ['username' => 'member1'],
            [
                'name' => 'Sajid Hasan',
                'email' => 'member1@house.local',
                'phone' => '01700000003',
                'role' => UserRole::Member->value,
                'password' => 'password123',
                'is_active' => true,
                'joined_at' => Carbon::now()->startOfMonth()->toDateString(),
            ]
        );

        $memberTwo = User::query()->updateOrCreate(
            ['username' => 'member2'],
            [
                'name' => 'Rafi Ahmed',
                'email' => 'member2@house.local',
                'phone' => '01700000004',
                'role' => UserRole::Member->value,
                'password' => 'password123',
                'is_active' => true,
                'joined_at' => Carbon::now()->startOfMonth()->toDateString(),
            ]
        );

        $mealPlan = MealPlan::query()->updateOrCreate(
            [
                'name' => now()->format('F Y').' Meal Plan',
                'start_date' => now()->copy()->startOfMonth()->toDateString(),
                'end_date' => now()->copy()->endOfMonth()->toDateString(),
            ],
            [
                'type' => 'monthly',
                'notes' => 'Default seeded monthly plan for local development.',
                'created_by' => $admin->id,
            ]
        );

        $mealStatusService->syncStatusesForPlan($mealPlan);

        GroceryItem::query()->updateOrCreate(
            ['title' => 'Rice', 'purchased_on' => now()->startOfMonth()->toDateString()],
            [
                'meal_plan_id' => $mealPlan->id,
                'category' => 'Staples',
                'quantity' => 25,
                'unit' => 'kg',
                'price' => 2200,
                'notes' => 'Monthly stock purchase',
                'added_by' => $admin->id,
            ]
        );

        GroceryItem::query()->updateOrCreate(
            ['title' => 'Chicken', 'purchased_on' => now()->subDays(2)->toDateString()],
            [
                'meal_plan_id' => $mealPlan->id,
                'category' => 'Protein',
                'quantity' => 8,
                'unit' => 'kg',
                'price' => 1800,
                'notes' => 'Weekend bulk order',
                'added_by' => $superAdmin->id,
            ]
        );

        MealStatus::query()
            ->where('user_id', $memberOne->id)
            ->whereDate('meal_date', now()->addDay()->toDateString())
            ->update([
                'skip_dinner' => true,
            ]);

        MealStatus::query()
            ->where('user_id', $memberTwo->id)
            ->whereDate('meal_date', now()->addDays(2)->toDateString())
            ->update([
                'skip_lunch' => true,
                'skip_dinner' => true,
            ]);
    }
}
