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
        Schema::create('payroll_other_earneds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_employee_id')->index();
            $table->unsignedBigInteger('payroll_id')->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->unsignedInteger('earning_type_id')->index();
            $table->string('type');
            $table->decimal('amount', 10, 2);
            $table->decimal('total', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_other_earneds');
    }
};