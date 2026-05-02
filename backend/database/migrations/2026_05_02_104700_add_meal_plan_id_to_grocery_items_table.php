<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grocery_items', function (Blueprint $table): void {
            $table->foreignId('meal_plan_id')->nullable()->after('id')->constrained('meal_plans')->nullOnDelete();
        });

        $fallbackMealPlanId = DB::table('meal_plans')->orderBy('start_date')->value('id');

        if ($fallbackMealPlanId) {
            DB::table('grocery_items')
                ->whereNull('meal_plan_id')
                ->update(['meal_plan_id' => $fallbackMealPlanId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grocery_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('meal_plan_id');
        });
    }
};
