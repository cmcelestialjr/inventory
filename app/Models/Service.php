<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'price', 
        'labor_cost',
        'estimate_duration',
        'remarks',
        'service_status',
        'updated_by',
        'created_by',        
    ];

    public function products(): HasMany
    {
        return $this->hasMany(ServicesProduct::class, 'service_id', 'id');
    }
}
