<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AdvanceDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'advance_id',
        'payroll_id',
        'deduction_amount',
        'deduction_date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function advance()
    {
        return $this->belongsTo(Advance::class, 'advance_id', 'id');
    }

    public function payroll()
    {
        return $this->belongsTo(Payroll::class, 'payroll_id', 'id');
    }
}