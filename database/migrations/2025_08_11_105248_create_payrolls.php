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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_type_id')->index();
            $table->string('code')->index();
            $table->string('year')->index();
            $table->string('month')->index();
            $table->string('type')->index(); //monthly, semi-monthly, weekly
            $table->string('day_range')->index()->nullable(); //1-15 or 16-30
            $table->string('week_range')->index()->nullable();
            $table->string('period')->nullable();
            $table->date('date_from')->index();
            $table->date('date_to')->index();
            $table->string('etal');
            $table->decimal('earned', 10, 2);
            $table->decimal('gross', 10, 2);
            $table->decimal('lwop', 10, 2);
            $table->decimal('deduction', 10, 2);
            $table->decimal('netpay', 10, 2);
            $table->date('date_to_bank')->index()->nullable();
            $table->unsignedBigInteger('created_by');
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
