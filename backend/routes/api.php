<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinanceSummaryController;
use App\Http\Controllers\Api\GroceryCatalogController;
use App\Http\Controllers\Api\GroceryItemController;
use App\Http\Controllers\Api\MealPlanController;
use App\Http\Controllers\Api\MealStatusController;
use App\Http\Controllers\Api\MemberPaymentController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/meal-statuses', [MealStatusController::class, 'index']);
    Route::patch('/meal-statuses/{mealStatus}', [MealStatusController::class, 'update']);

    Route::get('/groceries', [GroceryItemController::class, 'index']);
    Route::get('/grocery-catalog', [GroceryCatalogController::class, 'index']);

    Route::middleware('role:super_admin,admin')->group(function (): void {
        Route::get('/meal-plans/active', [MealPlanController::class, 'active']);
        Route::apiResource('meal-plans', MealPlanController::class)->only(['index', 'store', 'show']);
        Route::get('/finance-summary/monthly', [FinanceSummaryController::class, 'monthly']);

        Route::apiResource('groceries', GroceryItemController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('member-payments', MemberPaymentController::class)->only(['store', 'destroy']);

        Route::post('/users/transfer-admin', [UserController::class, 'transferAdminRole']);
        Route::apiResource('users', UserController::class)->only(['index', 'store', 'update']);
    });

    Route::middleware('role:super_admin')->group(function (): void {
        Route::apiResource('grocery-catalog', GroceryCatalogController::class)->only(['store', 'update', 'destroy']);
    });
});
