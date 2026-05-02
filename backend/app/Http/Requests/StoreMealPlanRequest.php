<?php

namespace App\Http\Requests;

use App\Enums\MealPlanType;
use App\Models\MealPlan;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMealPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::enum(MealPlanType::class)],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->filled('start_date') || ! $this->filled('end_date') || ! $this->filled('type')) {
                    return;
                }

                $startDate = Carbon::parse($this->string('start_date'))->startOfDay();
                $endDate = Carbon::parse($this->string('end_date'))->startOfDay();
                $type = $this->string('type')->value();

                if ($type === MealPlanType::Weekly->value && (int) $startDate->diffInDays($endDate) !== 6) {
                    $validator->errors()->add('end_date', 'A weekly plan must cover exactly 7 days.');
                }

                if ($type === MealPlanType::Monthly->value) {
                    $expectedCoverage = $startDate->daysInMonth - 1;

                    if ((int) $startDate->diffInDays($endDate) !== $expectedCoverage) {
                        $validator->errors()->add(
                            'end_date',
                            sprintf(
                                'A monthly plan starting on %s must cover exactly %d days.',
                                $startDate->toDateString(),
                                $startDate->daysInMonth
                            )
                        );
                    }
                }

                $overlapExists = MealPlan::query()
                    ->whereDate('start_date', '<=', $endDate->toDateString())
                    ->whereDate('end_date', '>=', $startDate->toDateString())
                    ->exists();

                if ($overlapExists) {
                    $validator->errors()->add('start_date', 'Another meal plan already overlaps this date range.');
                }
            },
        ];
    }
}
