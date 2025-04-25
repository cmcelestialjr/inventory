<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DamageStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name'
    ];
    public function damageList(): HasMany
    {
        return $this->hasMany(Damage::class, 'status_id', 'id');
    }
}