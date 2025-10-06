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
        Schema::create('employee_service_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('employee_id')->index();
            $table->unsignedInteger('service_id')->index();
            $table->decimal('service_amount_rate', 10, 2);
            $table->decimal('service_percentage_rate', 10, 2);
            $table->string('rate_type'); //amount or percentage
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_service_rates');
    }
};
