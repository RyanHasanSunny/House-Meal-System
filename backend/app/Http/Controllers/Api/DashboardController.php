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
                'data' => $this->memberDashboard($user, $mealStatusService),
            ]);
        }

        return response()->json([
            'role' => $user->role->value,
            'data' => $this->adminDashboard($mealStatusService),
        ]);
    }

    private function memberDashboard(User $user, MealStatusService $mealStatusService): array
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

        $planStatuses = $mealPlan
            ? MealStatus::query()
                ->where('meal_plan_id', $mealPlan->id)
                ->get()
            : collect();

        $countingWindow = $mealPlan
            ? $mealStatusService->buildCountingWindow($mealPlan->start_date, $mealPlan->end_date)
            : null;
        $countedStatuses = $mealStatusService->filterStatusesThrough($statuses, $countingWindow['counted_through'] ?? null);
        $countedPlanStatuses = $mealStatusService->filterStatusesThrough($planStatuses, $countingWindow['counted_through'] ?? null);

        $guestLunches = $mealStatusService->guestLunchCount($countedStatuses);
        $takenLunches = $mealStatusService->totalLunchCount($countedStatuses);
        $guestDinners = $mealStatusService->guestDinnerCount($countedStatuses);
        $takenDinners = $mealStatusService->totalDinnerCount($countedStatuses);
        $guestMeals = $guestLunches + $guestDinners;
        $takenMeals = $mealStatusService->totalMealCount($countedStatuses);
        $totalPlanMeals = $mealStatusService->totalMealCount($countedPlanStatuses);
        $mealRate = $mealPlan && $totalPlanMeals > 0
            ? round((float) $mealPlan->groceryItems()->sum('price') / $totalPlanMeals, 2)
            : 0.0;
        $mealCost = round($mealRate * $takenMeals, 2);

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
                'taken_lunches' => $takenLunches,
                'guest_lunches' => $guestLunches,
                'skipped_lunches' => $countedStatuses->where('skip_lunch', true)->count(),
                'taken_dinners' => $takenDinners,
                'guest_dinners' => $guestDinners,
                'skipped_dinners' => $countedStatuses->where('skip_dinner', true)->count(),
                'guest_meals' => $guestMeals,
                'taken_meals' => $takenMeals,
                'plan_counted_meals' => $totalPlanMeals,
                'meal_rate' => $mealRate,
                'meal_cost' => $mealCost,
                'counting' => $countingWindow ? $mealStatusService->serializeCountingWindow($countingWindow) : null,
                'upcoming_skips' => $statuses
                    ->filter(fn (MealStatus $status) => $status->meal_date->gt(today()) && ($status->skip_lunch || $status->skip_dinner))
                    ->count(),
            ],
            'upcoming' => $statuses
                ->filter(fn (MealStatus $status) => $status->meal_date->gte(today()))
                ->take(10)
                ->map(fn (MealStatus $status) => [
                    'id' => $status->id,
                    'meal_date' => $status->meal_date->toDateString(),
                    'skip_lunch' => $status->skip_lunch,
                    'guest_lunches' => $status->guest_lunches,
                    'skip_dinner' => $status->skip_dinner,
                    'guest_dinners' => $status->guest_dinners,
                    'guest_meals' => $status->guest_lunches + $status->guest_dinners,
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
                ->with('user:id,name,username')
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
                'lunches' => $mealStatusService->totalLunchCount($todayStatuses),
                'dinners' => $mealStatusService->totalDinnerCount($todayStatuses),
                'guest_meals' => $mealStatusService->guestLunchCount($todayStatuses) + $mealStatusService->guestDinnerCount($todayStatuses),
                'total_meals' => $mealStatusService->totalMealCount($todayStatuses),
                'lunch_members' => $todayStatuses
                    ->filter(fn (MealStatus $status): bool => ! $status->skip_lunch && $status->user !== null)
                    ->sortBy(fn (MealStatus $status): string => $status->user?->name ?? '')
                    ->map(fn (MealStatus $status): array => [
                        'id' => $status->user->id,
                        'name' => $status->user->name,
                        'username' => $status->user->username,
                        'guest_meals' => (int) $status->guest_lunches,
                        'total_meals' => 1 + (int) $status->guest_lunches,
                    ])
                    ->values()
                    ->all(),
                'dinner_members' => $todayStatuses
                    ->filter(fn (MealStatus $status): bool => ! $status->skip_dinner && $status->user !== null)
                    ->sortBy(fn (MealStatus $status): string => $status->user?->name ?? '')
                    ->map(fn (MealStatus $status): array => [
                        'id' => $status->user->id,
                        'name' => $status->user->name,
                        'username' => $status->user->username,
                        'guest_meals' => (int) $status->guest_dinners,
                        'total_meals' => 1 + (int) $status->guest_dinners,
                    ])
                    ->values()
                    ->all(),
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
