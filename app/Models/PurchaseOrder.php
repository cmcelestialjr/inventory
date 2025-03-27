<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'code',
        'supplier_id',
        'date_time_ordered',
        'date_time_received',
        'status_id',
        'remarks',
        'src',
        'updated_by',
        'created_by',
    ];

    public function supplierInfo(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function statusInfo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderStatus::class, 'status_id', 'id');
    }
    public function products(): HasMany
    {
        return $this->hasMany(PurchaseOrderProduct::class, 'purchase_order_id', 'id');
    }
}
