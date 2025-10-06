<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeScheduleDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'name', 
        'shorten',
        'day_no',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(EmployeeSchedule::class, 'schedule_id', 'id');
    }
}
