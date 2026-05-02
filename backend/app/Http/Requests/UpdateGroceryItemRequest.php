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
            'member_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'grocery_catalog_item_id' => ['sometimes', 'nullable', 'integer', 'exists:grocery_catalog_items,id'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255', 'required_without:grocery_catalog_item_id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'unit' => ['sometimes', 'required', 'string', 'max:30'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'purchased_on' => ['sometimes', 'required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
