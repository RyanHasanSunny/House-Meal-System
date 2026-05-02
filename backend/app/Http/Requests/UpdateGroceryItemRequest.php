<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGroceryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meal_plan_id' => ['sometimes', 'required', 'integer', 'exists:meal_plans,id'],
            'grocery_catalog_item_id' => ['sometimes', 'required', 'integer', 'exists:grocery_catalog_items,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'purchased_on' => ['sometimes', 'required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
