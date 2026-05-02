<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealStatus extends Model
{
    protected $fillable = [
        'user_id',
        'meal_plan_id',
        'meal_date',
        'skip_lunch',
        'skip_dinner',
    ];

    protected function casts(): array
    {
        return [
            'meal_date' => 'date',
            'skip_lunch' => 'boolean',
            'skip_dinner' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class);
    }
}
