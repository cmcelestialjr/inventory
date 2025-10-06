<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DtrDailySummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'schedule_in',
        'schedule_out',
        'actual_in',
        'actual_out',
        'late_minutes',
        'undertime_minutes',
        'is_absent',
        'incomplete_log',
        'salary',
        'earned',
        'deduction',
        'schedule_pay_type_id',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}