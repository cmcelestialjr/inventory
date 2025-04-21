<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 
        'supplier_id',
        'name', 
        'variant',
        'name_variant',
        'cost',
        'price',
        'qty',
        'restock_date',
        'product_status',
        'product_category_id',
        'img',
        'updated_by',
        'created_by',
    ];

    public function currentPricing(): HasOne
    {
        return $this->hasOne(ProductsPrice::class)->ofMany([
            'effective_date' => 'max',
            'id' => 'max',
        ], function (Builder $query) {
            $query->where('effective_date', '<', now());
        });
    }

    public function pricingList(): HasMany
    {
        return $this->hasMany(ProductsPrice::class, 'product_id', 'id')->orderBy('effective_date','DESC')->orderBy('id','DESC');
    }

    public function pricingListAvailable(): HasMany
    {
        return $this->hasMany(ProductsPrice::class, 'product_id', 'id')->where('qty','>',0)->orderBy('effective_date','ASC')->orderBy('id','ASC');
    }
    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductsCategory::class, 'product_category_id', 'id');
    }
    public function sales(): HasMany
    {
        return $this->hasMany(SalesProduct::class, 'product_id', 'id');
    }
}
