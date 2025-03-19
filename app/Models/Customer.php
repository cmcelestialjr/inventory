<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_type_id',
        'name', 
        'lastname', 
        'firstname',
        'middlename',
        'extname',
        'contact_no',
        'email',
        'address',
        'updated_by',
        'created_by',
    ];

}