<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroceryItem extends Model
{
    protected $fillable = [
        'meal_plan_id',
        'member_id',
        'grocery_catalog_item_id',
        'title',
        'category',
        'quantity',
        'unit',
        'price',
        'purchased_on',
        'notes',
        'added_by',
    ];

    protected function casts(): array
    {
        return [
            'purchased_on' => 'date',
            'price' => 'decimal:2',
            'quantity' => 'decimal:2',
        ];
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class);
    }

    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(GroceryCatalogItem::class, 'grocery_catalog_item_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }
}
