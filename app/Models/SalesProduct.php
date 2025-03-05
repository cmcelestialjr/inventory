<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id', 
        'sale_code', 
        'product_id',
        'return_id',
        'total_cost',
        'cost',
        'price',
        'discount_amount',
        'discount_percentage',
        'qty',
        'amount',
        'updated_by',
        'created_by',
    ];

    public function productInfo(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function saleInfo(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'id');
    }

    public function returnInfo(): HasMany
    {
        return $this->hasMany(Returns::class, 'sales_products_id', 'id');
    }

}
