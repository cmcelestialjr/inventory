<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'remarks',
        'updated_by',
        'created_by'
    ];

    public function expenseList(): HasMany
    {
        return $this->hasMany(Expense::class, 'category_id', 'id');
    }
    public function subCategoryList(): HasMany
    {
        return $this->hasMany(ExpenseSubCategory::class, 'category_id', 'id');
    }
}