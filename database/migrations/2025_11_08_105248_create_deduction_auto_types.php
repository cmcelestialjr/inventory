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
        Schema::create('deduction_auto_types', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('deduction_id')->index();
            $table->string('type')->index(); //monthly, semi-monthly, weekly
            $table->string('day_range')->index()->nullable(); //1st, 2nd half
            $table->string('week_range')->index()->nullable(); //1st, 2nd, 3rd, 4th, 5th week
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_auto_types');
    }
};
