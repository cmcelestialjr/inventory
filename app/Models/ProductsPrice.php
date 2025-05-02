<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductsPrice extends Model
{
    protected $fillable = [
        'product_id', 
        'cost',
        'price',
        'qty',
        'discount',
        'discount_percentage',
        'effective_date',
        'restock_date',
        'updated_by',
        'created_by',
    ];
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
}
