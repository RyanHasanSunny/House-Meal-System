<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteMemberPaymentRequest;
use App\Http\Requests\StoreMemberPaymentRequest;
use App\Models\MemberPayment;
use Illuminate\Http\JsonResponse;

class MemberPaymentController extends Controller
{
    public function store(StoreMemberPaymentRequest $request): JsonResponse
    {
        $payment = MemberPayment::query()->create([
            ...$request->validated(),
            'recorded_by' => $request->user()->id,
        ]);

        $payment->load(['user:id,name,username', 'recorder:id,name,username']);

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'paid_on' => $payment->paid_on->toDateString(),
                'notes' => $payment->notes,
                'user' => $payment->user
                    ? [
                        'id' => $payment->user->id,
                        'name' => $payment->user->name,
                        'username' => $payment->user->username,
                    ]
                    : null,
                'recorded_by' => $payment->recorder
                    ? [
                        'id' => $payment->recorder->id,
                        'name' => $payment->recorder->name,
                        'username' => $payment->recorder->username,
                    ]
                    : null,
            ],
        ], 201);
    }

    public function destroy(DeleteMemberPaymentRequest $request, MemberPayment $memberPayment): JsonResponse
    {
        $memberPayment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }
}
