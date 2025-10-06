<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Advance extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'employee_id',
        'advance_amount',
        'repayment_periods',
        'monthly_deduction',
        'total_deducted',
        'status_id',
        'date_issued',
        'date_cancelled',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(AdvanceStatus::class, 'status_id', 'id');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(AdvanceDeduction::class, 'advance_id', 'id');
    }

    public function deduction(): HasOne
    {
        return $this->hasOne(AdvanceDeduction::class, 'advance_id', 'id')->whereNull('payroll_id')->orderBy('id','ASC');
    }
}   