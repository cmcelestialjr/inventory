<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_employee_id',
        'payroll_id',
        'employee_id',
        'deduction_id',
        'amount',
    ];

    public function payrollEmployee(): BelongsTo
    {
        return $this->belongsTo(PayrollEmployee::class, 'payroll_employee_id', 'id');
    }
    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'payroll_id', 'id');
    }    
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function deduction(): BelongsTo
    {
        return $this->belongsTo(Deduction::class, 'deduction_id', 'id');
    }
}