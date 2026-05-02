<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroceryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meal_plan_id' => ['required', 'integer', 'exists:meal_plans,id'],
            'grocery_catalog_item_id' => ['required', 'integer', 'exists:grocery_catalog_items,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'price' => ['required', 'numeric', 'min:0'],
            'purchased_on' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
