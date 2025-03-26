<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderProduct extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'cost',
        'qty',
        'total',
        'cost_received',
        'qty_received',
        'total_received',
        'status_id',
        'updated_by',
        'created_by',
    ];

    public function purchaseInfo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id', 'id');
    }
    public function productInfo(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }
    public function statusInfo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderStatus::class, 'status_id', 'id');
    }
}
