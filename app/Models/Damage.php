<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Damage extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_product_id',
        'product_id',
        'status_id', 
        'price', 
        'cost',
        'qty', 
        'amount',
        'remarks',
        'updated_by',
        'created_by'
    ];
    public function returnProductInfo(): BelongsTo
    {
        return $this->belongsTo(ReturnsSalesProduct::class, 'return_product_id', 'id');
    }
    public function productInfo(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }
    public function statusInfo(): BelongsTo
    {
        return $this->belongsTo(DamageStatus::class, 'status_id', 'id');
    }
    public function productCost(): BelongsTo
    {
        return $this->belongsTo(ProductsPrice::class, 'product_id', 'product_id')
                ->where('cost', $this->cost);
    }
}