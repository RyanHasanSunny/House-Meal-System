<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'max:50',
                Rule::unique('users', 'username')->ignore($this->user()),
            ],
            'email' => [
                'nullable',
                'email',
                'max:120',
                Rule::unique('users', 'email')->ignore($this->user()),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
