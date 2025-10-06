<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeServiceRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'service_id', 
        'service_amount_rate',
        'service_percentage_rate',
        'rate_type'
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'id');
    }
}
