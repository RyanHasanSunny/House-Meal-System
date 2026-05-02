<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grocery_catalog_items', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('category', 80)->nullable();
            $table->string('default_unit', 30)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::table('grocery_catalog_items')->insert([
            ['name' => 'Rice', 'category' => 'Staples', 'default_unit' => 'kg', 'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Oil', 'category' => 'Staples', 'default_unit' => 'liter', 'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Turmeric (Halud)', 'category' => 'Masala', 'default_unit' => 'g', 'sort_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Black Pepper (Marich)', 'category' => 'Masala', 'default_unit' => 'g', 'sort_order' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cumin (Jira)', 'category' => 'Masala', 'default_unit' => 'g', 'sort_order' => 5, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Chicken', 'category' => 'Protein', 'default_unit' => 'kg', 'sort_order' => 6, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Fish', 'category' => 'Protein', 'default_unit' => 'kg', 'sort_order' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Egg', 'category' => 'Protein', 'default_unit' => 'piece', 'sort_order' => 8, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Potato', 'category' => 'Vegetable', 'default_unit' => 'kg', 'sort_order' => 9, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('grocery_catalog_items');
    }
};
