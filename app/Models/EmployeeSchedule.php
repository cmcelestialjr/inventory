<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'time_in', 
        'time_out',
        'schedule_pay_type_id'
    ];
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function payTypes(): BelongsTo
    {
        return $this->belongsTo(SchedulePayType::class, 'schedule_pay_type_id', 'id');
    }
    public function days(): HasMany
    {
        return $this->hasMany(EmployeeScheduleDay::class, 'schedule_id', 'id')->orderBy('day_no');
    }
}
