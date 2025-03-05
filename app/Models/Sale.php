<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id', 
        'customer_name', 
        'code',
        'total_cost',
        'total_price',
        'total_discount',
        'total_qty',
        'total_amount',
        'amount_paid',
        'amount_change',
        'cashier_id',
        'cashier_name',
        'updated_by',
        'created_by',
        'date_time_of_sale'
    ];

    public function paymentOptions(): HasMany
    {
        return $this->hasMany(SalesPayment::class, 'sale_id', 'id');
    }

    public function productsList(): HasMany
    {
        return $this->hasMany(SalesProduct::class, 'sale_id', 'id');
    }

}
