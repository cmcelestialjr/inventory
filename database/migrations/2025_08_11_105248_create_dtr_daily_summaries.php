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
        Schema::create('dtr_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id')->index();
            $table->date('date')->index();
            $table->time('schedule_in')->nullable();
            $table->time('schedule_out')->nullable();
            $table->time('actual_in')->nullable();
            $table->time('actual_out')->nullable();
            $table->integer('day')->default(0);
            $table->integer('hour')->default(0);
            $table->integer('minute')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->integer('undertime_minutes')->default(0);
            $table->integer('is_absent')->default(0); // 1 for absent
            $table->integer('incomplete_log')->default(0); // 1 for missing IN or OUT 
            $table->decimal('salary', 10, 2)->default(0);
            $table->decimal('earned', 10, 2)->default(0);
            $table->decimal('deduction', 10, 2)->default(0);
            $table->unsignedTinyInteger('schedule_pay_type_id')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
