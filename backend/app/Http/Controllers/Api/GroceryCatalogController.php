<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGroceryCatalogItemRequest;
use App\Http\Requests\UpdateGroceryCatalogItemRequest;
use App\Models\GroceryCatalogItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $catalogItems = GroceryCatalogItem::query()
            ->with('creator:id,name,username')
            ->when(
                $request->user()?->role->value !== 'super_admin',
                fn ($query) => $query->where('is_active', true)
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $catalogItems->map(fn (GroceryCatalogItem $item) => $this->itemPayload($item))->all(),
        ]);
    }

    public function store(StoreGroceryCatalogItemRequest $request): JsonResponse
    {
        $item = GroceryCatalogItem::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'created_by' => $request->user()->id,
        ]);

        $item->load('creator:id,name,username');

        return response()->json([
            'message' => 'Catalog item added successfully.',
            'data' => $this->itemPayload($item),
        ], 201);
    }

    public function update(UpdateGroceryCatalogItemRequest $request, GroceryCatalogItem $groceryCatalog): JsonResponse
    {
        $groceryCatalog->fill($request->validated())->save();
        $groceryCatalog->load('creator:id,name,username');

        return response()->json([
            'message' => 'Catalog item updated successfully.',
            'data' => $this->itemPayload($groceryCatalog),
        ]);
    }

    public function destroy(GroceryCatalogItem $groceryCatalog): JsonResponse
    {
        $groceryCatalog->delete();

        return response()->json([
            'message' => 'Catalog item deleted successfully.',
        ]);
    }

    private function itemPayload(GroceryCatalogItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'default_unit' => $item->default_unit,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'created_by' => $item->creator
                ? [
                    'id' => $item->creator->id,
                    'name' => $item->creator->name,
                    'username' => $item->creator->username,
                ]
                : null,
        ];
    }
}
