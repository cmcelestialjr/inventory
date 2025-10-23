<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EarningType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',  //daily, hourly, fixed
    ];
    public function employee(): HasMany
    {
        return $this->hasMany(EmployeeOtherEarning::class, 'earning_type_id', 'id');
    }
}
