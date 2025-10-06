<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DtrLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'dtr_device_id',
        'employee_id',
        'employee_no',
        'datetime',
        'state',
        'log_type',
        'updated_to_daily',
        'is_sent' //0 or 1
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
    public function device(): BelongsTo
    {
        return $this->belongsTo(DtrDevice::class, 'dtr_device_id', 'id');
    }
}