<?php

namespace App\Enums;

enum MealPlanType: string
{
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Custom = 'custom';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
