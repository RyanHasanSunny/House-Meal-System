<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\GroceryItem;
use App\Models\MealStatus;
use App\Models\MemberPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FinanceSummaryService
{
    public function buildMonthlySummary(string $month): array
    {
        $monthStart = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $monthKey = $monthStart->format('Y-m');

        $statuses = MealStatus::query()
            ->with('user:id,name,username,role,is_active')
            ->whereDate('meal_date', '>=', $monthStart->toDateString())
            ->whereDate('meal_date', '<=', $monthEnd->toDateString())
            ->orderBy('meal_date')
            ->get();

        $groceries = GroceryItem::query()
            ->with(['addedBy:id,name,username', 'member:id,name,username'])
            ->whereDate('purchased_on', '>=', $monthStart->toDateString())
            ->whereDate('purchased_on', '<=', $monthEnd->toDateString())
            ->orderByDesc('purchased_on')
            ->orderByDesc('id')
            ->get();

        $payments = MemberPayment::query()
            ->with(['user:id,name,username', 'recorder:id,name,username'])
            ->whereDate('paid_on', '>=', $monthStart->toDateString())
            ->whereDate('paid_on', '<=', $monthEnd->toDateString())
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->get();

        $historicalStatuses = MealStatus::query()
            ->whereDate('meal_date', '<=', $monthEnd->toDateString())
            ->orderBy('meal_date')
            ->get(['user_id', 'meal_date', 'skip_lunch', 'skip_dinner']);

        $historicalGroceries = GroceryItem::query()
            ->whereDate('purchased_on', '<=', $monthEnd->toDateString())
            ->orderBy('purchased_on')
            ->get(['price', 'purchased_on']);

        $historicalPayments = MemberPayment::query()
            ->whereDate('paid_on', '<=', $monthEnd->toDateString())
            ->orderBy('paid_on')
            ->get(['user_id', 'amount', 'paid_on']);

        $participantIds = $statuses->pluck('user_id')->unique()->values();
        $participants = $participantIds->isNotEmpty()
            ? User::query()
                ->whereIn('id', $participantIds)
                ->orderByRaw("case role when 'admin' then 1 when 'member' then 2 else 3 end")
                ->orderBy('name')
                ->get(['id', 'name', 'username', 'role'])
            : collect();

        $totalGross = (float) $groceries->sum('price');
        $totalMeals = $statuses->where('skip_lunch', false)->count() + $statuses->where('skip_dinner', false)->count();
        $participantCount = $participants->count();
        $perHeadExpense = $participantCount > 0 ? round($totalGross / $participantCount, 2) : 0.0;
        $mealRate = $totalMeals > 0 ? round($totalGross / $totalMeals, 2) : 0.0;

        $paymentsByUser = $payments->groupBy('user_id');
        $statusesByUser = $statuses->groupBy('user_id');
        $rollingBalances = $this->buildRollingBalances($historicalStatuses, $historicalGroceries, $historicalPayments, $monthKey);

        $members = $participants->map(function (User $user) use ($mealRate, $paymentsByUser, $rollingBalances, $statusesByUser): array {
            /** @var Collection<int, MealStatus> $userStatuses */
            $userStatuses = $statusesByUser->get($user->id, collect());
            $takenLunches = $userStatuses->where('skip_lunch', false)->count();
            $takenDinners = $userStatuses->where('skip_dinner', false)->count();
            $takenMeals = $takenLunches + $takenDinners;
            $payableAmount = round($takenMeals * $mealRate, 2);
            $paidAmount = round((float) $paymentsByUser->get($user->id, collect())->sum('amount'), 2);
            $openingBalance = (float) ($rollingBalances[$user->id]['opening_balance'] ?? 0.0);
            $closingBalance = (float) ($rollingBalances[$user->id]['closing_balance'] ?? 0.0);
            $carriedAdvanceAmount = round(max($openingBalance, 0), 2);
            $advanceUsedAmount = round(max(min($carriedAdvanceAmount, max($payableAmount - $paidAmount, 0)), 0), 2);
            $dueAmount = round(max(-$closingBalance, 0), 2);
            $advanceAmount = round(max($closingBalance, 0), 2);

            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role->value,
                    'role_label' => $user->role->label(),
                ],
                'taken_lunches' => $takenLunches,
                'taken_dinners' => $takenDinners,
                'taken_meals' => $takenMeals,
                'paid_amount' => $paidAmount,
                'payable_amount' => $payableAmount,
                'due_amount' => $dueAmount,
                'advance_amount' => $advanceAmount,
                'carried_advance_amount' => $carriedAdvanceAmount,
                'advance_used_amount' => $advanceUsedAmount,
            ];
        })->values();

        return [
            'month' => $monthStart->format('Y-m'),
            'period' => [
                'start_date' => $monthStart->toDateString(),
                'end_date' => $monthEnd->toDateString(),
            ],
            'totals' => [
                'total_gross' => round($totalGross, 2),
                'total_members' => $participantCount,
                'per_head_expense' => $perHeadExpense,
                'total_meals' => $totalMeals,
                'meal_rate' => $mealRate,
                'total_paid' => round((float) $payments->sum('amount'), 2),
                'total_due' => round((float) $members->sum('due_amount'), 2),
            ],
            'members' => $members->all(),
            'groceries' => $groceries->map(fn (GroceryItem $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'price' => (float) $item->price,
                'purchased_on' => $item->purchased_on->toDateString(),
                'notes' => $item->notes,
                'member' => $item->member
                    ? [
                        'id' => $item->member->id,
                        'name' => $item->member->name,
                        'username' => $item->member->username,
                    ]
                    : null,
                'added_by' => $item->addedBy
                    ? [
                        'id' => $item->addedBy->id,
                        'name' => $item->addedBy->name,
                        'username' => $item->addedBy->username,
                    ]
                    : null,
            ])->values()->all(),
            'payments' => $payments->map(fn (MemberPayment $payment) => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'paid_on' => $payment->paid_on->toDateString(),
                'notes' => $payment->notes,
                'user' => $payment->user
                    ? [
                        'id' => $payment->user->id,
                        'name' => $payment->user->name,
                        'username' => $payment->user->username,
                    ]
                    : null,
                'recorded_by' => $payment->recorder
                    ? [
                        'id' => $payment->recorder->id,
                        'name' => $payment->recorder->name,
                        'username' => $payment->recorder->username,
                    ]
                    : null,
            ])->values()->all(),
            'eligible_members' => User::query()
                ->whereIn('role', [UserRole::Admin->value, UserRole::Member->value])
                ->where('is_active', true)
                ->orderByRaw("case role when 'admin' then 1 when 'member' then 2 else 3 end")
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role->value,
                    'role_label' => $user->role->label(),
                ])->values()->all(),
        ];
    }

    /**
     * @param  Collection<int, MealStatus>  $statuses
     * @param  Collection<int, GroceryItem>  $groceries
     * @param  Collection<int, MemberPayment>  $payments
     * @return array<int, array{opening_balance: float, closing_balance: float}>
     */
    private function buildRollingBalances(Collection $statuses, Collection $groceries, Collection $payments, string $selectedMonth): array
    {
        $statusesByMonth = $statuses->groupBy(fn (MealStatus $status) => $status->meal_date->format('Y-m'));
        $groceriesByMonth = $groceries->groupBy(fn (GroceryItem $item) => $item->purchased_on->format('Y-m'));
        $paymentsByMonth = $payments->groupBy(fn (MemberPayment $payment) => $payment->paid_on->format('Y-m'));

        $months = collect([
            ...$statusesByMonth->keys()->all(),
            ...$groceriesByMonth->keys()->all(),
            ...$paymentsByMonth->keys()->all(),
        ])->unique()->sort()->values();

        $balances = [];

        foreach ($months as $monthKey) {
            /** @var Collection<int, MealStatus> $monthStatuses */
            $monthStatuses = $statusesByMonth->get($monthKey, collect());
            /** @var Collection<int, GroceryItem> $monthGroceries */
            $monthGroceries = $groceriesByMonth->get($monthKey, collect());
            /** @var Collection<int, MemberPayment> $monthPayments */
            $monthPayments = $paymentsByMonth->get($monthKey, collect());

            $monthGross = (float) $monthGroceries->sum('price');
            $monthMeals = $monthStatuses->where('skip_lunch', false)->count() + $monthStatuses->where('skip_dinner', false)->count();
            $monthMealRate = $monthMeals > 0 ? round($monthGross / $monthMeals, 2) : 0.0;

            $monthPayablesByUser = $monthStatuses
                ->groupBy('user_id')
                ->map(function (Collection $userStatuses) use ($monthMealRate): float {
                    $takenMeals = $userStatuses->where('skip_lunch', false)->count() + $userStatuses->where('skip_dinner', false)->count();

                    return round($takenMeals * $monthMealRate, 2);
                });

            $monthPaymentsByUser = $monthPayments
                ->groupBy('user_id')
                ->map(fn (Collection $userPayments): float => round((float) $userPayments->sum('amount'), 2));

            $userIds = collect([
                ...$monthPayablesByUser->keys()->all(),
                ...$monthPaymentsByUser->keys()->all(),
            ])->unique();

            foreach ($userIds as $userId) {
                $currentBalance = (float) ($balances[$userId]['closing_balance'] ?? 0.0);
                $nextBalance = round(
                    $currentBalance
                    + (float) ($monthPaymentsByUser->get($userId, 0.0))
                    - (float) ($monthPayablesByUser->get($userId, 0.0)),
                    2
                );

                $balances[$userId] ??= [
                    'opening_balance' => 0.0,
                    'closing_balance' => 0.0,
                ];

                if ($monthKey === $selectedMonth) {
                    $balances[$userId]['opening_balance'] = $currentBalance;
                }

                $balances[$userId]['closing_balance'] = $nextBalance;
            }
        }

        return $balances;
    }
}
