<?php

namespace App\Http\Requests;

use App\Models\GroceryCatalogItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeleteGroceryCatalogItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirmation_text' => ['required', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var GroceryCatalogItem|null $groceryCatalog */
                $groceryCatalog = $this->route('groceryCatalog') ?? $this->route('grocery_catalog');

                if (! $groceryCatalog) {
                    return;
                }

                if ($this->string('confirmation_text')->trim()->value() !== $groceryCatalog->name) {
                    $validator->errors()->add('confirmation_text', 'Type the exact catalog item name to delete it.');
                }
            },
        ];
    }
}
