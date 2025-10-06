<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AdvanceStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function advances()
    {
        return $this->hasMany(Advance::class, 'status_id', 'id');
    }
}