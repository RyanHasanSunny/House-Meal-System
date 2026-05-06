<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class TransferAdminRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_user_id' => ['required', 'integer', 'exists:users,id'],
            'confirmation_text' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $target = User::query()->find($this->integer('target_user_id'));

                if (! $target) {
                    return;
                }

                if ($this->string('confirmation_text')->trim()->value() !== '@'.$target->username) {
                    $validator->errors()->add('confirmation_text', 'Type the exact target member handle to transfer admin access.');
                }
            },
        ];
    }
}
