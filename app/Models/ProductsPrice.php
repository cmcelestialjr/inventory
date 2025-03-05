<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
