<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnsSalesProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'sales_products_id',
        'price',
        'qty',
        'amount',
        'updated_by',
        'created_by',
    ];

    public function returnInfo(): BelongsTo
    {
        return $this->belongsTo(Returns::class, 'return_id', 'id');
    }
    public function saleProductInfo(): BelongsTo
    {
        return $this->belongsTo(SalesProduct::class, 'sales_products_id', 'id');
    }
}