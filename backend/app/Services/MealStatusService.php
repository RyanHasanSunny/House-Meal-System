<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class MealStatusService
{
    public function syncStatusesForPlan(MealPlan $mealPlan): void
    {
        $participants = User::query()
            ->whereIn('role', $this->participantRoles())
            ->where('is_active', true)
            ->get(['id', 'joined_at']);

        $rows = [];

        foreach ($participants as $participant) {
            $memberStartDate = $participant->joined_at instanceof Carbon
                ? $participant->joined_at->copy()
                : Carbon::parse($participant->joined_at ?? $mealPlan->start_date);

            $startDate = $mealPlan->start_date->copy()->max($memberStartDate);

            if ($startDate->gt($mealPlan->end_date)) {
                continue;
            }

            foreach (CarbonPeriod::create($startDate, $mealPlan->end_date) as $date) {
                $rows[] = [
                    'user_id' => $participant->id,
                    'meal_plan_id' => $mealPlan->id,
                    'meal_date' => $date->toDateString(),
                    'skip_lunch' => false,
                    'guest_lunches' => 0,
                    'skip_dinner' => false,
                    'guest_dinners' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        $this->upsertRows($rows);
    }

    public function syncStatusesForUser(User $user): void
    {
        if (! $this->isMealParticipant($user)) {
            return;
        }

        $joinedAt = $user->joined_at instanceof Carbon
            ? $user->joined_at->copy()
            : Carbon::parse($user->joined_at ?? now());

        $mealPlans = MealPlan::query()
            ->whereDate('end_date', '>=', $joinedAt->toDateString())
            ->orderBy('start_date')
            ->get();

        $rows = [];

        foreach ($mealPlans as $mealPlan) {
            $startDate = $mealPlan->start_date->copy()->max($joinedAt);

            if ($startDate->gt($mealPlan->end_date)) {
                continue;
            }

            foreach (CarbonPeriod::create($startDate, $mealPlan->end_date) as $date) {
                $rows[] = [
                    'user_id' => $user->id,
                    'meal_plan_id' => $mealPlan->id,
                    'meal_date' => $date->toDateString(),
                    'skip_lunch' => false,
                    'guest_lunches' => 0,
                    'skip_dinner' => false,
                    'guest_dinners' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        $this->upsertRows($rows);
    }

    public function pruneFutureStatusesForUser(User $user): void
    {
        MealStatus::query()
            ->where('user_id', $user->id)
            ->whereDate('meal_date', '>=', today()->toDateString())
            ->delete();
    }

    public function isMealParticipant(User $user): bool
    {
        return $user->is_active && in_array($user->role->value, $this->participantRoles(), true);
    }

    public function buildPlanSummary(MealPlan $mealPlan): array
    {
        $statuses = $mealPlan->mealStatuses()
            ->with('user:id,name,username')
            ->orderBy('meal_date')
            ->get();

        $countingWindow = $this->buildCountingWindow($mealPlan->start_date, $mealPlan->end_date);
        $countedStatuses = $this->filterStatusesThrough($statuses, $countingWindow['counted_through']);

        return [
            'member_count' => $statuses->pluck('user_id')->unique()->count(),
            'tracked_days' => $countingWindow['total_days'],
            'counting' => $this->serializeCountingWindow($countingWindow),
            'totals' => $this->totalsSummary($countedStatuses),
            'members' => $this->memberSummary($statuses, $countingWindow['counted_through']),
            'days' => $this->dailySummary($countedStatuses),
        ];
    }

    /**
     * @return array{
     *     counted_through: ?Carbon,
     *     counted_days: int,
     *     total_days: int,
     *     remaining_days: int,
     *     status: 'not_started'|'in_progress'|'completed'
     * }
     */
    public function buildCountingWindow(Carbon $startDate, Carbon $endDate, ?Carbon $referenceDate = null): array
    {
        $start = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->startOfDay();
        $reference = ($referenceDate ?? today())->copy()->startOfDay();
        $totalDays = $start->diffInDays($end) + 1;

        if ($reference->lt($start)) {
            return [
                'counted_through' => null,
                'counted_days' => 0,
                'total_days' => $totalDays,
                'remaining_days' => $totalDays,
                'status' => 'not_started',
            ];
        }

        $countedThrough = $reference->lte($end) ? $reference : $end->copy();
        $countedDays = $start->diffInDays($countedThrough) + 1;
        $remainingDays = max($totalDays - $countedDays, 0);

        return [
            'counted_through' => $countedThrough,
            'counted_days' => $countedDays,
            'total_days' => $totalDays,
            'remaining_days' => $remainingDays,
            'status' => $remainingDays === 0 ? 'completed' : 'in_progress',
        ];
    }

    /**
     * @return array{
     *     counted_through: ?string,
     *     counted_days: int,
     *     total_days: int,
     *     remaining_days: int,
     *     status: 'not_started'|'in_progress'|'completed'
     * }
     */
    public function serializeCountingWindow(array $countingWindow): array
    {
        return [
            'counted_through' => $countingWindow['counted_through']?->toDateString(),
            'counted_days' => $countingWindow['counted_days'],
            'total_days' => $countingWindow['total_days'],
            'remaining_days' => $countingWindow['remaining_days'],
            'status' => $countingWindow['status'],
        ];
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @return Collection<int, MealStatus>
     */
    public function filterStatusesThrough(Collection $statuses, ?Carbon $countedThrough): Collection
    {
        if (! $countedThrough) {
            return $statuses->filter(fn () => false);
        }

        return $statuses->filter(
            fn (MealStatus $status): bool => $status->meal_date->lte($countedThrough)
        );
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function ownLunchCount(Collection $statuses): int
    {
        return $statuses->where('skip_lunch', false)->count();
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function ownDinnerCount(Collection $statuses): int
    {
        return $statuses->where('skip_dinner', false)->count();
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function guestLunchCount(Collection $statuses): int
    {
        return (int) $statuses->sum(fn (MealStatus $status): int => (int) $status->guest_lunches);
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function guestDinnerCount(Collection $statuses): int
    {
        return (int) $statuses->sum(fn (MealStatus $status): int => (int) $status->guest_dinners);
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function totalLunchCount(Collection $statuses): int
    {
        return $this->ownLunchCount($statuses) + $this->guestLunchCount($statuses);
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function totalDinnerCount(Collection $statuses): int
    {
        return $this->ownDinnerCount($statuses) + $this->guestDinnerCount($statuses);
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     */
    public function totalMealCount(Collection $statuses): int
    {
        return $this->totalLunchCount($statuses) + $this->totalDinnerCount($statuses);
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @return array<int, array<string, mixed>>
     */
    private function memberSummary(Collection $statuses, ?Carbon $countedThrough): array
    {
        return $statuses
            ->groupBy('user_id')
            ->map(function (Collection $items) use ($countedThrough): array {
                /** @var MealStatus $first */
                $first = $items->first();
                $countedItems = $this->filterStatusesThrough($items, $countedThrough);

                return [
                    'user' => [
                        'id' => $first->user->id,
                        'name' => $first->user->name,
                        'username' => $first->user->username,
                    ],
                    'own_lunches' => $this->ownLunchCount($countedItems),
                    'guest_lunches' => $this->guestLunchCount($countedItems),
                    'taken_lunches' => $this->totalLunchCount($countedItems),
                    'skipped_lunches' => $countedItems->where('skip_lunch', true)->count(),
                    'own_dinners' => $this->ownDinnerCount($countedItems),
                    'guest_dinners' => $this->guestDinnerCount($countedItems),
                    'taken_dinners' => $this->totalDinnerCount($countedItems),
                    'skipped_dinners' => $countedItems->where('skip_dinner', true)->count(),
                    'guest_meals' => $this->guestLunchCount($countedItems) + $this->guestDinnerCount($countedItems),
                    'taken_meals' => $this->totalMealCount($countedItems),
                    'days' => $items->map(
                        fn (MealStatus $status): array => $this->memberDaySummary($status, $countedThrough)
                    )->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @return array<int, array<string, mixed>>
     */
    private function dailySummary(Collection $statuses): array
    {
        return $statuses
            ->groupBy(fn (MealStatus $status) => $status->meal_date->toDateString())
            ->map(fn (Collection $items, string $date): array => [
                'date' => $date,
                'own_lunches' => $this->ownLunchCount($items),
                'guest_lunches' => $this->guestLunchCount($items),
                'taken_lunches' => $this->totalLunchCount($items),
                'skipped_lunches' => $items->where('skip_lunch', true)->count(),
                'own_dinners' => $this->ownDinnerCount($items),
                'guest_dinners' => $this->guestDinnerCount($items),
                'taken_dinners' => $this->totalDinnerCount($items),
                'skipped_dinners' => $items->where('skip_dinner', true)->count(),
                'guest_meals' => $this->guestLunchCount($items) + $this->guestDinnerCount($items),
                'taken_meals' => $this->totalMealCount($items),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @return array{
     *     taken_lunches: int,
     *     skipped_lunches: int,
     *     taken_dinners: int,
     *     skipped_dinners: int,
     *     taken_meals: int
     * }
     */
    private function totalsSummary(Collection $statuses): array
    {
        return [
            'own_lunches' => $this->ownLunchCount($statuses),
            'guest_lunches' => $this->guestLunchCount($statuses),
            'taken_lunches' => $this->totalLunchCount($statuses),
            'skipped_lunches' => $statuses->where('skip_lunch', true)->count(),
            'own_dinners' => $this->ownDinnerCount($statuses),
            'guest_dinners' => $this->guestDinnerCount($statuses),
            'taken_dinners' => $this->totalDinnerCount($statuses),
            'skipped_dinners' => $statuses->where('skip_dinner', true)->count(),
            'guest_meals' => $this->guestLunchCount($statuses) + $this->guestDinnerCount($statuses),
            'taken_meals' => $this->totalMealCount($statuses),
        ];
    }

    private function memberDaySummary(MealStatus $status, ?Carbon $countedThrough): array
    {
        $isCounted = $countedThrough ? $status->meal_date->lte($countedThrough) : false;
        $lunchMeals = ($status->skip_lunch ? 0 : 1) + (int) $status->guest_lunches;
        $dinnerMeals = ($status->skip_dinner ? 0 : 1) + (int) $status->guest_dinners;

        return [
            'date' => $status->meal_date->toDateString(),
            'counted' => $isCounted,
            'lunch_status' => $status->skip_lunch ? 'skipped' : 'taken',
            'guest_lunches' => (int) $status->guest_lunches,
            'lunch_meals' => $lunchMeals,
            'dinner_status' => $status->skip_dinner ? 'skipped' : 'taken',
            'guest_dinners' => (int) $status->guest_dinners,
            'dinner_meals' => $dinnerMeals,
            'guest_meals' => (int) $status->guest_lunches + (int) $status->guest_dinners,
            'meal_total' => $lunchMeals + $dinnerMeals,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function upsertRows(array $rows): void
    {
        collect($rows)
            ->chunk(500)
            ->each(function (Collection $chunk): void {
                MealStatus::query()->upsert(
                    $chunk->all(),
                    ['user_id', 'meal_date'],
                    ['meal_plan_id', 'updated_at']
                );
            });
    }

    /**
     * @return array<int, string>
     */
    private function participantRoles(): array
    {
        return [
            UserRole::Admin->value,
            UserRole::Member->value,
        ];
    }
}
