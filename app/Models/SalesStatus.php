<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SalesStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name'
    ];
    
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'sales_status_id', 'id');
    }
}
