<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_emplopyee_id',
        'employee_id',
        'deduction_id',
        'amount',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function deduction(): BelongsTo
    {
        return $this->belongsTo(Deduction::class, 'deduction_id', 'id');
    }
    public function periods()
    {
        return $this->hasMany(EmployeeDeductionPeriod::class, 'deduction_id', 'deduction_id')
            ->whereColumn('employee_id', 'employee_deductions.employee_id');
    }
}