<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeductionAutoTypes extends Model
{
    use HasFactory;

    protected $fillable = [
        'deduction_id',
        'type', //monthly, semi-monthly, weekly
        'day_range', //1st, 2nd half
        'week_range', //1st, 2nd, 3rd, 4th, 5th week
    ];

    public function deduction(): BelongsTo
    {
        return $this->belongsTo(Deduction::class, 'deduction_id', 'id');
    }
}