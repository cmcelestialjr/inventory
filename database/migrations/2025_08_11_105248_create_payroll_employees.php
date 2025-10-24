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
        Schema::create('payroll_employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_id')->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->string('lastname')->index();
            $table->string('firstname')->index();
            $table->string('middlename')->nullable();
            $table->string('extname')->nullable();
            $table->string('position');
            $table->decimal('salary', 10, 2);
            $table->decimal('no_of_day_present', 10, 2);
            $table->decimal('earned', 10, 2);
            $table->decimal('basic_pay', 10, 2);
            $table->decimal('overtime', 10, 2);
            $table->decimal('other_earned', 10, 2);
            $table->decimal('holiday', 10, 2);
            $table->decimal('lates_absences', 10, 2);
            $table->decimal('gross', 10, 2);
            $table->decimal('deduction', 10, 2);
            $table->decimal('netpay', 10, 2);
            $table->decimal('lates', 10, 2);
            $table->decimal('absences', 10, 2);
            $table->decimal('no_of_lates', 10, 2);
            $table->decimal('no_of_undertimes', 10, 2);
            $table->decimal('no_of_absences', 10, 2);
            $table->integer('day');
            $table->integer('hour');
            $table->integer('minute');
            $table->integer('ot_hour');
            $table->integer('ot_minute');
            $table->string('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_employees');
    }
};
