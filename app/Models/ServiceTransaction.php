<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'service_id',
        'service_name',
        'customer_id',
        'customer_name',
        'service_status_id',
        'payment_status_id',
        'price',
        'product_cost',
        'labor_cost',
        'discount',
        'total_cost',
        'amount',
        'paid',
        'remaining',
        'date_started',
        'date_finished',
        'day_out',
        'remarks',
        'updated_by',
        'created_by',
    ];

    public function serviceInfo(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'id');
    }
    public function customerInfo(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function paymentStatus(): BelongsTo
    {
        return $this->belongsTo(PaymentStatus::class, 'payment_status_id', 'id');
    }
    public function serviceStatus(): BelongsTo
    {
        return $this->belongsTo(PaymentStatus::class, 'payment_status_id', 'id');
    }
}