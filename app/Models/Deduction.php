<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'group',
        'type',
        'amount',
        'percentage',
        'ceiling',
        'employer_amount',
    ];

    public function payrolls(): HasMany
    {
        return $this->hasMany(PayrollDeduction::class, 'deduction_id', 'id');
    }
    public function employees(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class, 'deduction_id', 'id');
    }
    public function periods(): HasMany
    {
        return $this->hasMany(EmployeeDeductionPeriod::class, 'deduction_id', 'id');
    }
    public function auto(): HasOne
    {
        return $this->hasOne(DeductionAutoTypes::class, 'deduction_id', 'id');
    }
}