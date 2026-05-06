<?php

namespace App\Http\Requests;

use App\Models\MemberPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeleteMemberPaymentRequest extends FormRequest
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
                /** @var MemberPayment|null $memberPayment */
                $memberPayment = $this->route('memberPayment') ?? $this->route('member_payment');

                if (! $memberPayment) {
                    return;
                }

                $memberPayment->loadMissing('user:id,username');
                $expectedTarget = $memberPayment->user
                    ? '@'.$memberPayment->user->username
                    : 'payment-'.$memberPayment->id;

                if ($this->string('confirmation_text')->trim()->value() !== $expectedTarget) {
                    $validator->errors()->add('confirmation_text', 'Type the exact payment reference to delete it.');
                }
            },
        ];
    }
}
