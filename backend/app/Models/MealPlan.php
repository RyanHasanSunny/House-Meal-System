<?php

namespace App\Models;

use App\Enums\MealPlanType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MealPlan extends Model
{
    protected $fillable = [
        'name',
        'type',
        'start_date',
        'end_date',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'type' => MealPlanType::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function mealStatuses(): HasMany
    {
        return $this->hasMany(MealStatus::class);
    }

    public function groceryItems(): HasMany
    {
        return $this->hasMany(GroceryItem::class);
    }
}
