<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grocery_items', function (Blueprint $table): void {
            $table->foreignId('grocery_catalog_item_id')
                ->nullable()
                ->after('meal_plan_id')
                ->constrained('grocery_catalog_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('grocery_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('grocery_catalog_item_id');
        });
    }
};
