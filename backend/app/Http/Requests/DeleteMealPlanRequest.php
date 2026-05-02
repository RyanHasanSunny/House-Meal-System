<?php

namespace App\Http\Requests;

use App\Models\MealPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeleteMealPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirmation_name' => ['required', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var MealPlan|null $mealPlan */
                $mealPlan = $this->route('mealPlan');

                if (! $mealPlan) {
                    return;
                }

                if ($this->string('confirmation_name')->trim()->value() !== $mealPlan->name) {
                    $validator->errors()->add('confirmation_name', 'Type the exact meal plan name to delete it.');
                }
            },
        ];
    }
}
