<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\GroceryItem;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use App\Services\MealStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request, MealStatusService $mealStatusService): JsonResponse
    {
        $user = $request->user();

        if ($user->role->value === UserRole::Member->value) {
            return response()->json([
                'role' => $user->role->value,
                'data' => $this->memberDashboard($user),
            ]);
        }

        return response()->json([
            'role' => $user->role->value,
            'data' => $this->adminDashboard($mealStatusService),
        ]);
    }

    private function memberDashboard(User $user): array
    {
        $mealPlan = MealPlan::query()
            ->whereDate('start_date', '<=', today()->toDateString())
            ->whereDate('end_date', '>=', today()->toDateString())
            ->first()
            ?? MealPlan::query()
                ->whereDate('end_date', '>=', today()->toDateString())
                ->orderBy('start_date')
                ->first();

        $statuses = MealStatus::query()
            ->where('user_id', $user->id)
            ->when($mealPlan, fn ($query) => $query->where('meal_plan_id', $mealPlan->id))
            ->orderBy('meal_date')
            ->get();

        return [
            'active_plan' => $mealPlan
                ? [
                    'id' => $mealPlan->id,
                    'name' => $mealPlan->name,
                    'type' => $mealPlan->type->value,
                    'start_date' => $mealPlan->start_date->toDateString(),
                    'end_date' => $mealPlan->end_date->toDateString(),
                ]
                : null,
            'summary' => [
                'taken_lunches' => $statuses->where('skip_lunch', false)->count(),
                'skipped_lunches' => $statuses->where('skip_lunch', true)->count(),
                'taken_dinners' => $statuses->where('skip_dinner', false)->count(),
                'skipped_dinners' => $statuses->where('skip_dinner', true)->count(),
                'upcoming_skips' => $statuses
                    ->filter(fn (MealStatus $status) => $status->meal_date->gte(today()) && ($status->skip_lunch || $status->skip_dinner))
                    ->count(),
            ],
            'upcoming' => $statuses
                ->filter(fn (MealStatus $status) => $status->meal_date->gte(today()))
                ->take(10)
                ->map(fn (MealStatus $status) => [
                    'id' => $status->id,
                    'meal_date' => $status->meal_date->toDateString(),
                    'skip_lunch' => $status->skip_lunch,
                    'skip_dinner' => $status->skip_dinner,
                ])
                ->values()
                ->all(),
        ];
    }

    private function adminDashboard(MealStatusService $mealStatusService): array
    {
        $today = today()->toDateString();
        $activePlan = MealPlan::query()
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        $todayStatuses = $activePlan
            ? MealStatus::query()
                ->where('meal_plan_id', $activePlan->id)
                ->whereDate('meal_date', $today)
                ->get()
            : collect();

        $recentGroceries = GroceryItem::query()
            ->with('addedBy:id,name,username')
            ->orderByDesc('purchased_on')
            ->take(5)
            ->get();

        $currentAdmin = User::query()
            ->where('role', UserRole::Admin->value)
            ->orderBy('name')
            ->first();

        return [
            'counts' => [
                'members' => User::query()->where('role', UserRole::Member->value)->count(),
                'admins' => User::query()->where('role', UserRole::Admin->value)->count(),
                'active_members' => User::query()->where('role', UserRole::Member->value)->where('is_active', true)->count(),
                'meal_plans' => MealPlan::query()->count(),
            ],
            'today' => [
                'lunches' => $todayStatuses->where('skip_lunch', false)->count(),
                'dinners' => $todayStatuses->where('skip_dinner', false)->count(),
                'total_meals' => $todayStatuses->where('skip_lunch', false)->count() + $todayStatuses->where('skip_dinner', false)->count(),
            ],
            'current_admin' => $currentAdmin
                ? [
                    'id' => $currentAdmin->id,
                    'name' => $currentAdmin->name,
                    'username' => $currentAdmin->username,
                ]
                : null,
            'groceries' => [
                'monthly_spend' => (float) GroceryItem::query()
                    ->whereMonth('purchased_on', now()->month)
                    ->whereYear('purchased_on', now()->year)
                    ->sum('price'),
                'recent' => $recentGroceries->map(fn (GroceryItem $item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'price' => (float) $item->price,
                    'purchased_on' => $item->purchased_on->toDateString(),
                    'added_by' => $item->addedBy?->name,
                ])->all(),
            ],
            'active_plan' => $activePlan
                ? [
                    'id' => $activePlan->id,
                    'name' => $activePlan->name,
                    'type' => $activePlan->type->value,
                    'start_date' => $activePlan->start_date->toDateString(),
                    'end_date' => $activePlan->end_date->toDateString(),
                    'grocery_total_spend' => (float) $activePlan->groceryItems()->sum('price'),
                    'grocery_items_count' => $activePlan->groceryItems()->count(),
                    'summary' => $mealStatusService->buildPlanSummary($activePlan),
                ]
                : null,
        ];
    }
}
