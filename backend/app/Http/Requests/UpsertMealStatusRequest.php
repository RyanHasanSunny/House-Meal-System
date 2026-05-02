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
            'skip_dinner' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->hasAny(['skip_lunch', 'skip_dinner'])) {
                    $validator->errors()->add('skip_lunch', 'At least one meal status field is required.');
                }
            },
        ];
    }
}
