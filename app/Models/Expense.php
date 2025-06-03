<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'sub_category_id',
        'code', 
        'expense_name', 
        'product_id',
        'tin',
        'or',
        'amount', 
        'qty',
        'cost',        
        'date_time_of_expense',
        'updated_by',
        'created_by'
    ];
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id', 'id');
    }
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ExpenseSubCategory::class, 'sub_category_id', 'id');
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }
}