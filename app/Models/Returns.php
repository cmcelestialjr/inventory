<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Returns extends Model
{
    use HasFactory;

    protected $table = "returns";

    protected $fillable = [
        'code',
        'sales_id',
        'sales_code',
        'sales_of_return_id',
        'sales_of_return_code',
        'return_option_id',
        'refund_amount',
        'total_amount',
        'remarks',
        'return_type_id',
        'date_time_returned',
        'cashier_id',
        'cashier_name',
        'updated_by',
        'created_by',
    ];

    public function saleInfo(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'id');
    }
    public function returnSalesProductsList(): HasMany
    {
        return $this->hasMany(ReturnsSalesProduct::class, 'return_id', 'id');
    }
    public function changeSaleInfo(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sales_of_return_id', 'id');
    }
    public function returnOptionInfo(): BelongsTo
    {
        return $this->belongsTo(ReturnsOption::class, 'return_option_id', 'id');
    }
    public function returnTypeInfo(): BelongsTo
    {
        return $this->belongsTo(ReturnsType::class, 'return_type_id', 'id');
    }
}