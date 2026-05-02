<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'username' => ['sometimes', 'required', 'string', 'alpha_dash', 'max:50', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'email' => ['nullable', 'email', 'max:120', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['sometimes', 'required', Rule::enum(UserRole::class)],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'joined_at' => ['nullable', 'date'],
        ];
    }
}
