<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'alpha_dash', 'max:50', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:120', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'joined_at' => ['nullable', 'date'],
        ];
    }
}
