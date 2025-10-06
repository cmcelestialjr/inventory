<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_type_id',
        'code',
        'year',
        'month',
        'type',
        'day_range',
        'week_range',
        'period',
        'date_from',
        'date_to',
        'etal',
        'earned',
        'gross',
        'lwop',
        'deduction',
        'netpay',
        'date_to_bank',
        'created_by',
    ];

    public function payrollType(): BelongsTo
    {
        return $this->belongsTo(PayrollType::class, 'payroll_type_id', 'id');
    }
    public function employees(): HasMany
    {
        return $this->hasMany(PayrollEmployee::class, 'payroll_id', 'id');
    }
    public function totalEmployees()
    {
        return $this->employees()->get()->count();
    }
}