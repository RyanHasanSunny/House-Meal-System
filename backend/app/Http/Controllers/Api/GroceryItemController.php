<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteGroceryItemRequest;
use App\Http\Requests\StoreGroceryItemRequest;
use App\Http\Requests\UpdateGroceryItemRequest;
use App\Models\GroceryCatalogItem;
use App\Models\GroceryItem;
use App\Models\MealPlan;
use App\Models\MemberPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $mealPlan = $this->resolveMealPlan($request);

        $groceries = GroceryItem::query()
            ->with(['addedBy:id,name,username', 'member:id,name,username', 'mealPlan:id,name,type,start_date,end_date', 'catalogItem:id,name,category,default_unit'])
            ->when($mealPlan, fn ($query) => $query->where('meal_plan_id', $mealPlan->id))
            ->orderByDesc('purchased_on')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $groceries->map(fn (GroceryItem $item) => $this->itemPayload($item))->all(),
            'meta' => [
                'selected_meal_plan' => $mealPlan ? $this->planPayload($mealPlan) : null,
                'total_spend' => (float) $groceries->sum('price'),
                'item_count' => $groceries->count(),
            ],
        ]);
    }

    public function store(StoreGroceryItemRequest $request): JsonResponse
    {
        $actor = $request->user();
        $catalogItem = null;
        if ($request->filled('grocery_catalog_item_id')) {
            $catalogItem = GroceryCatalogItem::query()
                ->whereKey($request->integer('grocery_catalog_item_id'))
                ->where('is_active', true)
                ->firstOrFail();
        }

        $item = GroceryItem::query()->create([
            ...$request->validated(),
            'member_id' => $actor->id,
            'title' => $catalogItem?->name ?? (string) $request->string('title'),
            'category' => $catalogItem?->category,
            'unit' => $request->string('unit')->value(),
            'added_by' => $actor->id,
        ]);

        MemberPayment::query()->create([
            'user_id' => $item->member_id,
            'grocery_item_id' => $item->id,
            'amount' => $item->price,
            'paid_on' => $item->purchased_on,
            'notes' => 'Grocery: ' . $item->title . ($item->notes ? ' - ' . $item->notes : ''),
            'recorded_by' => $actor->id,
        ]);

        $item->load(['addedBy:id,name,username', 'member:id,name,username', 'mealPlan:id,name,type,start_date,end_date', 'catalogItem:id,name,category,default_unit']);

        return response()->json([
            'message' => 'Grocery item added successfully.',
            'data' => $this->itemPayload($item),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        abort(405);
    }

    public function update(UpdateGroceryItemRequest $request, GroceryItem $grocery): JsonResponse
    {
        $payload = $request->validated();

        if (array_key_exists('grocery_catalog_item_id', $payload) && filled($payload['grocery_catalog_item_id'])) {
            $catalogItem = GroceryCatalogItem::query()
                ->whereKey($payload['grocery_catalog_item_id'])
                ->where('is_active', true)
                ->firstOrFail();

            $payload['title'] = $catalogItem->name;
            $payload['category'] = $catalogItem->category;
        }

        if (array_key_exists('grocery_catalog_item_id', $payload) && blank($payload['grocery_catalog_item_id'])) {
            $payload['grocery_catalog_item_id'] = null;
            $payload['category'] = null;
        }

        $grocery->fill($payload)->save();

        $payment = MemberPayment::query()
            ->where('grocery_item_id', $grocery->id)
            ->first();

        if ($payment) {
            $payment->update([
                'user_id' => $grocery->member_id,
                'amount' => $grocery->price,
                'paid_on' => $grocery->purchased_on,
                'notes' => 'Grocery: ' . $grocery->title . ($grocery->notes ? ' - ' . $grocery->notes : ''),
            ]);
        }

        $grocery->load(['addedBy:id,name,username', 'member:id,name,username', 'mealPlan:id,name,type,start_date,end_date', 'catalogItem:id,name,category,default_unit']);

        return response()->json([
            'message' => 'Grocery item updated successfully.',
            'data' => $this->itemPayload($grocery),
        ]);
    }

    public function destroy(DeleteGroceryItemRequest $request, GroceryItem $grocery): JsonResponse
    {
        MemberPayment::query()->where('grocery_item_id', $grocery->id)->delete();

        $grocery->delete();

        return response()->json([
            'message' => 'Grocery item deleted successfully.',
        ]);
    }

    private function itemPayload(GroceryItem $item): array
    {
        return [
            'id' => $item->id,
            'meal_plan' => $item->mealPlan ? $this->planPayload($item->mealPlan) : null,
            'member' => $item->member
                ? [
                    'id' => $item->member->id,
                    'name' => $item->member->name,
                    'username' => $item->member->username,
                ]
                : null,
            'catalog_item' => $item->catalogItem
                ? [
                    'id' => $item->catalogItem->id,
                    'name' => $item->catalogItem->name,
                    'category' => $item->catalogItem->category,
                    'default_unit' => $item->catalogItem->default_unit,
                ]
                : null,
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
        ];
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

    private function planPayload(MealPlan $mealPlan): array
    {
        return [
            'id' => $mealPlan->id,
            'name' => $mealPlan->name,
            'type' => $mealPlan->type->value,
            'start_date' => $mealPlan->start_date->toDateString(),
            'end_date' => $mealPlan->end_date->toDateString(),
        ];
    }
}
