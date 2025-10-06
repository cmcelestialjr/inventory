<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_no',
        'lastname', 
        'firstname',
        'middlename',
        'extname',
        'position',
        'salary', 
        'employment_status', 
        'email',
        'contact_no',
        'dob',
        'sex',
        'status',
        'address',
        'picture',
    ];
    public function schedule(): HasOne
    {
        return $this->hasOne(EmployeeSchedule::class, 'employee_id', 'id');
    }
    public function payrolls(): HasMany
    {
        return $this->hasMany(PayrollEmployee::class, 'employee_id', 'id');
    }
    public function payrollMonths(): HasMany
    {
        return $this->hasMany(PayrollMonth::class, 'employee_id', 'id');
    }
    public function dtr_summary(): HasMany
    {
        return $this->hasMany(DtrDailySummary::class, 'employee_id', 'id');
    }
    public function deductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class, 'employee_id', 'id');
    }
    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class, 'employee_id', 'id');
    }
    public function advances(): HasMany
    {
        return $this->hasMany(Advance::class, 'employee_id', 'id');
    }
    public function advanceDeduction(): HasOne
    {
        return $this->hasOne(AdvanceDeduction::class, 'employee_id', 'id')->whereNull('payroll_id')->orderBy('id','ASC');
    }
}
