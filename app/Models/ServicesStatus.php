<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServicesStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
        'updated_by',
        'created_by'
    ];
    
    public function transactions(): HasMany
    {
        return $this->hasMany(ServiceTransaction::class, 'service_status_id', 'id');
    }
}
