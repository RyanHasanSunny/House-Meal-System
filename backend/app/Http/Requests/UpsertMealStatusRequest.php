<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpsertMealStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'skip_lunch' => ['sometimes', 'boolean'],
            'guest_lunches' => ['sometimes', 'integer', 'min:0', 'max:3'],
            'skip_dinner' => ['sometimes', 'boolean'],
            'guest_dinners' => ['sometimes', 'integer', 'min:0', 'max:3'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->hasAny(['skip_lunch', 'skip_dinner', 'guest_lunches', 'guest_dinners'])) {
                    $validator->errors()->add('skip_lunch', 'At least one meal status field is required.');
                }
            },
        ];
    }
}
