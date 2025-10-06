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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_no')->unique()->nullable();
            $table->string('lastname')->index();
            $table->string('firstname')->index();
            $table->string('middlename')->nullable();
            $table->string('extname')->nullable();
            $table->string('position')->index();
            $table->decimal('salary', 10, 2);
            $table->string('employment_status')->nullable()->index();
            $table->string('email')->unique()->nullable();
            $table->string('contact_no')->nullable();
            $table->date('dob')->nullable()->index();
            $table->string('status')->index();
            $table->string('sex')->index();
            $table->string('address')->nullable();
            $table->string('picture')->nullable();
            $table->date('date_started')->index()->nullable();
            $table->date('date_separated')->index()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
