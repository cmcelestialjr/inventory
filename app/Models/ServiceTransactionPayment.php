<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceTransactionPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_transaction_id',
        'amount',
        'payment_date',
        'updated_by',
        'created_by'
    ];
    
    public function transactionInfo(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_transaction_id', 'id');
    }
}
