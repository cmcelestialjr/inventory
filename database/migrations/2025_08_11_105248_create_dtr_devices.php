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
        Schema::create('dtr_devices', function (Blueprint $table) {
            $table->id();
            $table->string('ipaddress')->index();
            $table->string('port');
            $table->timestamp('datetime')->index();
            $table->string('log_type')->index(); //in or out or both
            $table->string('location')->nullable();
            $table->string('status')->index(); //Active or Inactive
            $table->string('power_state')->index(); //On or Off
            $table->string('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dtr_devices');
    }
};
