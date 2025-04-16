<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReturnsType extends Model
{
    use HasFactory;


    protected $fillable = [
        'name',
    ];

    public function returns(): HasMany
    {
        return $this->hasMany(Returns::class, 'return_type_id', 'id');
    }
}