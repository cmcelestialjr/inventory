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
        Schema::create('advances', function (Blueprint $table) {
            $table->id();
            $table->string('code')->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->decimal('advance_amount', 10, 2);
            $table->unsignedTinyInteger('repayment_periods');
            $table->decimal('monthly_deduction', 10, 2);
            $table->decimal('total_deducted', 10, 2)->default(0.00);
            $table->integer('status_id')->index();
            $table->date('date_issued')->nullable();
            $table->date('date_cancelled')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advances');
    }
};