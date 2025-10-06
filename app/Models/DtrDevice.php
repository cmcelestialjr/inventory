<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DtrDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'ipaddress',
        'port',
        'datetime',
        'state',  //1 finger, 15 face
        'log_type',  //in, out or both
        'location',
        'status', //Active or Inactive
        'power_state', //On or Off
        'remarks',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(DtrLog::class, 'dtr_device_id', 'id');
    }
    
}