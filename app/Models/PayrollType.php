<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PayrollType extends Model
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
        'etal',
        'gross',
        'lwop',
        'deduction',
        'netpay',
    ];

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'payroll_type_id', 'id');
    }
    
}