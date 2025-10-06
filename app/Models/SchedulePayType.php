<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SchedulePayType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'pay_multiplier',
        'description'
    ];
    
    public function employees(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class, 'schedule_pay_type_id', 'id');
    }
}
