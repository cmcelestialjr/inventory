<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SalesPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'payment_option_id', 
        'payment_option_name', 
        'amount',
        'amount_paid',
        'amount_change',
        'total_amount',
        'payment_status',
        'updated_by',
        'created_by',
    ];
    
    public function saleInfo(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'id');
    }

    public function paymentOptionInfo(): BelongsTo
    {
        return $this->belongsTo(PaymentOption::class, 'payment_option_id', 'id');
    }

}
