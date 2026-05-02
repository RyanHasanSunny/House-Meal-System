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
                    'skip_dinner' => false,
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
                    'skip_dinner' => false,
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

        return [
            'member_count' => $statuses->pluck('user_id')->unique()->count(),
            'tracked_days' => $mealPlan->start_date->diffInDays($mealPlan->end_date) + 1,
            'totals' => [
                'taken_lunches' => $statuses->where('skip_lunch', false)->count(),
                'skipped_lunches' => $statuses->where('skip_lunch', true)->count(),
                'taken_dinners' => $statuses->where('skip_dinner', false)->count(),
                'skipped_dinners' => $statuses->where('skip_dinner', true)->count(),
                'taken_meals' => $statuses->where('skip_lunch', false)->count() + $statuses->where('skip_dinner', false)->count(),
            ],
            'members' => $this->memberSummary($statuses),
            'days' => $this->dailySummary($statuses),
        ];
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @return array<int, array<string, mixed>>
     */
    private function memberSummary(Collection $statuses): array
    {
        return $statuses
            ->groupBy('user_id')
            ->map(function (Collection $items): array {
                /** @var MealStatus $first */
                $first = $items->first();

                return [
                    'user' => [
                        'id' => $first->user->id,
                        'name' => $first->user->name,
                        'username' => $first->user->username,
                    ],
                    'taken_lunches' => $items->where('skip_lunch', false)->count(),
                    'skipped_lunches' => $items->where('skip_lunch', true)->count(),
                    'taken_dinners' => $items->where('skip_dinner', false)->count(),
                    'skipped_dinners' => $items->where('skip_dinner', true)->count(),
                    'taken_meals' => $items->where('skip_lunch', false)->count() + $items->where('skip_dinner', false)->count(),
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
                'taken_lunches' => $items->where('skip_lunch', false)->count(),
                'skipped_lunches' => $items->where('skip_lunch', true)->count(),
                'taken_dinners' => $items->where('skip_dinner', false)->count(),
                'skipped_dinners' => $items->where('skip_dinner', true)->count(),
            ])
            ->values()
            ->all();
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
