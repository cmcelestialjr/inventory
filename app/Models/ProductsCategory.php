<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductsCategory extends Model
{
    protected $fillable = [
        'name',
    ];

    public function returns(): HasMany
    {
        return $this->hasMany(Product::class, 'product_category_id', 'id');
    }
}
