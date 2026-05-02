<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grocery_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->string('unit')->nullable();
            $table->decimal('price', 10, 2);
            $table->date('purchased_on');
            $table->text('notes')->nullable();
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grocery_items');
    }
};
