<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PurchaseOrderPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'payment_option_id',
        'payment_option_name',
        'amount',
        'payment_date',
        'updated_by',
        'created_by'
    ];
    
    public function purchaseOrderInfo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id', 'id');
    }
    public function paymentOptionInfo(): BelongsTo
    {
        return $this->belongsTo(PaymentOption::class, 'payment_option_id', 'id');
    }
}
