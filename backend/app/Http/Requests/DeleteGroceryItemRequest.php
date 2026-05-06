<?php

namespace App\Http\Requests;

use App\Models\GroceryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeleteGroceryItemRequest extends FormRequest
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
                /** @var GroceryItem|null $grocery */
                $grocery = $this->route('grocery');

                if (! $grocery) {
                    return;
                }

                if ($this->string('confirmation_text')->trim()->value() !== $grocery->title) {
                    $validator->errors()->add('confirmation_text', 'Type the exact grocery item title to delete it.');
                }
            },
        ];
    }
}
