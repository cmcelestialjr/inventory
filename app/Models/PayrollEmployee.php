<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollEmployee extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'year',
        'month',
        'lastname',
        'firstname',
        'middlename',
        'extname',
        'position',
        'salary',
        'no_of_day_present',
        'earned',
        'basic_pay',
        'overtime',
        'other_earned',
        'holiday',
        'lates_absences',
        'gross',
        'deduction',
        'netpay',
        'lates',
        'absences',
        'no_of_lates',
        'no_of_undertimes',
        'no_of_absences',
        'day',
        'hour',
        'minute',
        'ot_hour',
        'ot_minute',
        'remarks',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'payroll_id', 'id');
    }
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function deductionList(): HasMany
    {
        return $this->hasMany(PayrollDeduction::class, 'payroll_employee_id', 'id');
    }
    public function months(): HasMany
    {
        return $this->hasMany(PayrollMonth::class, 'payroll_employee_id', 'id');
    }
    public function otherEarned(): HasMany
    {
        return $this->hasMany(PayrollOtherEarned::class, 'payroll_employee_id', 'id');
    }
}