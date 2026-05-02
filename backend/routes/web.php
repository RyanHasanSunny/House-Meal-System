<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'House Meal System API',
        'status' => 'ok',
    ]);
});
