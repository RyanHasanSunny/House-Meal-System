<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertMealStatusRequest;
use App\Models\MealPlan;
use App\Models\MealStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MealStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $selectedUser = $this->resolveSubjectUser($request, $actor);
        $mealPlan = $this->resolveMealPlan($request);

        $query = MealStatus::query()
            ->with('mealPlan:id,name,start_date,end_date,type')
            ->where('user_id', $selectedUser->id)
            ->orderBy('meal_date');

        if ($mealPlan) {
            $query->where('meal_plan_id', $mealPlan->id);
        } else {
            $startDate = $request->date('start_date') ?? now()->startOfWeek();
            $endDate = $request->date('end_date') ?? now()->addDays(13);

            $query
                ->whereDate('meal_date', '>=', $startDate->toDateString())
                ->whereDate('meal_date', '<=', $endDate->toDateString());
        }

        $statuses = $query->get();

        return response()->json([
            'data' => $statuses->map(fn (MealStatus $mealStatus) => $this->statusPayload($mealStatus, $actor))->all(),
            'meta' => [
                'selected_user' => [
                    'id' => $selectedUser->id,
                    'name' => $selectedUser->name,
                    'username' => $selectedUser->username,
                ],
                'meal_plan' => $mealPlan
                    ? [
                        'id' => $mealPlan->id,
                        'name' => $mealPlan->name,
                        'type' => $mealPlan->type->value,
                        'start_date' => $mealPlan->start_date->toDateString(),
                        'end_date' => $mealPlan->end_date->toDateString(),
                    ]
                    : null,
            ],
        ]);
    }

    public function update(UpsertMealStatusRequest $request, MealStatus $mealStatus): JsonResponse
    {
        $actor = $request->user();
        $mealStatus->loadMissing('user:id,role');

        if (! $mealStatus->belongsToUser($actor) && $actor->role->value !== UserRole::SuperAdmin->value) {
            abort(403, 'You can only update your own meal status.');
        }

        if (
            ! $mealStatus->belongsToUser($actor)
            && $mealStatus->user?->role->value !== UserRole::Member->value
        ) {
            abort(422, 'Super admin can only update meal statuses for members.');
        }

        if ($request->has('skip_lunch') && ! $this->canEditMeal($mealStatus, 'lunch')) {
            abort(422, 'Lunch skip time has passed.');
        }

        if ($request->has('skip_dinner') && ! $this->canEditMeal($mealStatus, 'dinner')) {
            abort(422, 'Dinner skip time has passed.');
        }

        $mealStatus->fill($request->validated())->save();
        $mealStatus->loadMissing('mealPlan:id,name,start_date,end_date,type');

        return response()->json([
            'message' => 'Meal status updated successfully.',
            'data' => $this->statusPayload($mealStatus, $actor),
        ]);
    }

    private function resolveSubjectUser(Request $request, User $actor): User
    {
        if (! $request->filled('user_id')) {
            return $actor;
        }

        $selectedUser = User::query()->findOrFail($request->integer('user_id'));

        if ($selectedUser->is($actor)) {
            return $actor;
        }

        if ($actor->role->value !== UserRole::SuperAdmin->value) {
            abort(403, 'Only the super admin can view meal statuses for other members.');
        }

        if ($selectedUser->role->value !== UserRole::Member->value) {
            abort(422, 'Only member meal statuses can be managed here.');
        }

        return $selectedUser;
    }

    private function resolveMealPlan(Request $request): ?MealPlan
    {
        if ($request->filled('meal_plan_id')) {
            return MealPlan::query()->findOrFail($request->integer('meal_plan_id'));
        }

        $today = today()->toDateString();

        return MealPlan::query()
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first()
            ?? MealPlan::query()
                ->whereDate('end_date', '>=', $today)
                ->orderBy('start_date')
                ->first();
    }

    private function statusPayload(MealStatus $mealStatus, User $actor): array
    {
        $canEditLunch = $this->canEditMeal($mealStatus, 'lunch');
        $canEditDinner = $this->canEditMeal($mealStatus, 'dinner');

        return [
            'id' => $mealStatus->id,
            'meal_date' => $mealStatus->meal_date->toDateString(),
            'skip_lunch' => $mealStatus->skip_lunch,
            'skip_dinner' => $mealStatus->skip_dinner,
            'lunch_status' => $mealStatus->skip_lunch ? 'skipped' : 'taken',
            'dinner_status' => $mealStatus->skip_dinner ? 'skipped' : 'taken',
            'can_edit' => $canEditLunch || $canEditDinner,
            'can_edit_lunch' => $canEditLunch,
            'can_edit_dinner' => $canEditDinner,
            'meal_plan' => $mealStatus->mealPlan
                ? [
                    'id' => $mealStatus->mealPlan->id,
                    'name' => $mealStatus->mealPlan->name,
                    'type' => $mealStatus->mealPlan->type->value,
                ]
                : null,
        ];
    }

    private function canEditMeal(MealStatus $mealStatus, string $meal): bool
    {
        if ($mealStatus->meal_date->isAfter(today())) {
            return true;
        }

        if ($mealStatus->meal_date->isBefore(today())) {
            return false;
        }

        $cutoff = $this->mealCutoff($meal);

        return now()->lt($cutoff);
    }

    private function mealCutoff(string $meal): Carbon
    {
        $time = (string) config("meal.cutoffs.{$meal}");

        return now()->copy()->setTimeFromTimeString($time);
    }
}
