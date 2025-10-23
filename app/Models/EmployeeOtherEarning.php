<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EmployeeOtherEarning extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'earning_type_id', 
        'amount',
    ];
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function type(): BelongsTo
    {
        return $this->belongsTo(EarningType::class, 'earning_type_id', 'id');
    }
}
