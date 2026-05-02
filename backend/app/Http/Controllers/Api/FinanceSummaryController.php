<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceSummaryController extends Controller
{
    public function monthly(Request $request, FinanceSummaryService $financeSummaryService): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));

        return response()->json([
            'data' => $financeSummaryService->buildMonthlySummary($month),
        ]);
    }
}
