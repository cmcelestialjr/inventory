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
        Schema::create('payroll_months', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_employee_id')->index();
            $table->unsignedBigInteger('payroll_id')->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->string('year')->index();
            $table->string('month')->index();
            $table->decimal('amount', 10, 2);
            $table->decimal('earned', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_months');
    }
};
