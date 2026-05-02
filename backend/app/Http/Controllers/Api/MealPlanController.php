<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteMealPlanRequest;
use App\Http\Requests\StoreMealPlanRequest;
use App\Models\MemberPayment;
use App\Models\MealPlan;
use App\Models\User;
use App\Services\MealStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MealPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $mealPlans = MealPlan::query()
            ->with('creator:id,name,username')
            ->withCount(['mealStatuses', 'groceryItems'])
            ->orderByDesc('start_date')
            ->get();

        return response()->json([
            'data' => $mealPlans->map(fn (MealPlan $mealPlan) => $this->planPayload($mealPlan))->all(),
        ]);
    }

    public function store(StoreMealPlanRequest $request, MealStatusService $mealStatusService): JsonResponse
    {
        $mealPlan = MealPlan::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        $mealStatusService->syncStatusesForPlan($mealPlan);
        $mealPlan->load('creator:id,name,username');

        return response()->json([
            'message' => 'Meal plan created successfully.',
            'data' => $this->planPayload($mealPlan, $mealStatusService->buildPlanSummary($mealPlan)),
        ], 201);
    }

    public function show(MealPlan $mealPlan, MealStatusService $mealStatusService): JsonResponse
    {
        $mealPlan->load([
            'creator:id,name,username',
            'groceryItems' => fn ($query) => $query
                ->with('addedBy:id,name,username')
                ->orderByDesc('purchased_on')
                ->orderByDesc('id'),
        ]);

        return response()->json([
            'data' => $this->planPayload($mealPlan, $mealStatusService->buildPlanSummary($mealPlan)),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        abort(405);
    }

    public function destroy(DeleteMealPlanRequest $request, MealPlan $mealPlan): JsonResponse
    {
        DB::transaction(function () use ($mealPlan): void {
            $groceryItemIds = $mealPlan->groceryItems()->pluck('id');

            if ($groceryItemIds->isNotEmpty()) {
                MemberPayment::query()
                    ->whereIn('grocery_item_id', $groceryItemIds)
                    ->delete();
            }

            $mealPlan->groceryItems()->delete();
            $mealPlan->delete();
        });

        return response()->json([
            'message' => 'Meal plan deleted successfully.',
        ]);
    }

    public function active(MealStatusService $mealStatusService): JsonResponse
    {
        $today = today()->toDateString();

        $mealPlan = MealPlan::query()
            ->with('creator:id,name,username')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        if (! $mealPlan) {
            $mealPlan = MealPlan::query()
                ->with('creator:id,name,username')
                ->whereDate('end_date', '>=', $today)
                ->orderBy('start_date')
                ->first();
        }

        if (! $mealPlan) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => $this->planPayload($mealPlan, $mealStatusService->buildPlanSummary($mealPlan)),
        ]);
    }

    private function planPayload(MealPlan $mealPlan, ?array $summary = null): array
    {
        $currentAdmin = User::query()
            ->where('role', 'admin')
            ->orderBy('name')
            ->first();

        $groceryItems = $mealPlan->relationLoaded('groceryItems')
            ? $mealPlan->groceryItems
            : $mealPlan->groceryItems()->with('addedBy:id,name,username')->get();

        return [
            'id' => $mealPlan->id,
            'name' => $mealPlan->name,
            'type' => $mealPlan->type->value,
            'type_label' => $mealPlan->type->label(),
            'start_date' => $mealPlan->start_date->toDateString(),
            'end_date' => $mealPlan->end_date->toDateString(),
            'notes' => $mealPlan->notes,
            'meal_statuses_count' => $mealPlan->meal_statuses_count ?? $mealPlan->mealStatuses()->count(),
            'grocery_items_count' => $mealPlan->grocery_items_count ?? $mealPlan->groceryItems()->count(),
            'created_by' => $mealPlan->creator
                ? [
                    'id' => $mealPlan->creator->id,
                    'name' => $mealPlan->creator->name,
                    'username' => $mealPlan->creator->username,
                ]
                : null,
            'current_admin' => $currentAdmin
                ? [
                    'id' => $currentAdmin->id,
                    'name' => $currentAdmin->name,
                    'username' => $currentAdmin->username,
                ]
                : null,
            'groceries' => [
                'total_spend' => (float) $groceryItems->sum('price'),
                'item_count' => $groceryItems->count(),
                'items' => $groceryItems->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'category' => $item->category,
                    'quantity' => (float) $item->quantity,
                    'unit' => $item->unit,
                    'price' => (float) $item->price,
                    'purchased_on' => $item->purchased_on->toDateString(),
                    'notes' => $item->notes,
                    'added_by' => $item->addedBy
                        ? [
                            'id' => $item->addedBy->id,
                            'name' => $item->addedBy->name,
                            'username' => $item->addedBy->username,
                        ]
                        : null,
                ])->values()->all(),
            ],
            'summary' => $summary,
        ];
    }
}
