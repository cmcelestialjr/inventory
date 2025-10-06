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
        Schema::create('employee_schedule_days', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('schedule_id')->index();
            $table->string('name');
            $table->string('shorten');
            $table->integer('day_no');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_schedule_days');
    }
};
