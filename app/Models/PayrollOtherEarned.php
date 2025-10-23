<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollOtherEarned extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_employee_id',
        'payroll_id',
        'employee_id',
        'earning_type_id',
        'type',
        'amount',
        'total',
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
    public function earningType(): BelongsTo
    {
        return $this->belongsTo(EarningType::class, 'earning_type_id', 'id');
    }
}