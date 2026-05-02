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

        $statuses = MealStatus::query()
            ->with('user:id,name,username,role,is_active')
            ->whereDate('meal_date', '>=', $monthStart->toDateString())
            ->whereDate('meal_date', '<=', $monthEnd->toDateString())
            ->orderBy('meal_date')
            ->get();

        $groceries = GroceryItem::query()
            ->whereDate('purchased_on', '>=', $monthStart->toDateString())
            ->whereDate('purchased_on', '<=', $monthEnd->toDateString())
            ->get(['id', 'price', 'purchased_on']);

        $payments = MemberPayment::query()
            ->with(['user:id,name,username', 'recorder:id,name,username'])
            ->whereDate('paid_on', '>=', $monthStart->toDateString())
            ->whereDate('paid_on', '<=', $monthEnd->toDateString())
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->get();

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

        $members = $participants->map(function (User $user) use ($mealRate, $paymentsByUser, $statusesByUser): array {
            /** @var Collection<int, \App\Models\MealStatus> $userStatuses */
            $userStatuses = $statusesByUser->get($user->id, collect());
            $takenLunches = $userStatuses->where('skip_lunch', false)->count();
            $takenDinners = $userStatuses->where('skip_dinner', false)->count();
            $takenMeals = $takenLunches + $takenDinners;
            $payableAmount = round($takenMeals * $mealRate, 2);
            $paidAmount = round((float) $paymentsByUser->get($user->id, collect())->sum('amount'), 2);
            $dueAmount = round(max($payableAmount - $paidAmount, 0), 2);
            $advanceAmount = round(max($paidAmount - $payableAmount, 0), 2);

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
}
