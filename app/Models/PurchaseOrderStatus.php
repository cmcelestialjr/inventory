<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderStatus extends Model
{
    protected $fillable = [
        'name',
        'color',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'status_id', 'id');
    }
    public function purchaseOrderProducts(): HasMany
    {
        return $this->hasMany(PurchaseOrderProduct::class, 'status_id', 'id');
    }
}
