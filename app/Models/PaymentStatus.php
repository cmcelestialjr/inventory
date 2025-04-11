<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PaymentStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function servicePayments(): HasMany
    {
        return $this->hasMany(ServiceTransaction::class, 'payment_status_id', 'id');
    }
    public function puchaseOrdersPayments(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'payment_status_id', 'id');
    }
    
}