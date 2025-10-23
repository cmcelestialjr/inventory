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
        Schema::create('dtr_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dtr_device_id')->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->string('employee_no')->index();
            $table->timestamp('datetime')->index();
            $table->integer('state');  //1 finger, 15 face 
            $table->string('log_type')->index(); //in or out
            $table->integer('updated_to_daily')->index(); // 0 or 1
            $table->integer('is_sent')->nullable(); //0 or 1
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dtr_logs');
    }
};
