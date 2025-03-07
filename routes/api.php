<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpensesController;
use App\Http\Controllers\PaymentOptionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\UsersController;
use App\Models\Returns;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use SebastianBergmann\CodeCoverage\Report\Html\Dashboard;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard/top-section', [DashboardController::class, 'topSection']);
    Route::get('/dashboard/middle-section', [DashboardController::class, 'middleSection']);
    Route::get('/dashboard/bottom-section', [DashboardController::class, 'bottomSection']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products/store', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::get('/products/summary', [ProductController::class, 'summary']);
    Route::put('/product-pricing/{id}', [ProductController::class, 'updatePricing']);
    Route::post('/product-pricing', [ProductController::class, 'storePricing']);
    Route::get('/fetch-products', [ProductController::class, 'fetch']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales-confirm', [SaleController::class, 'store']);
    Route::get('/fetch-sales', [SaleController::class, 'fetch']);
    
    Route::get('/fetch-customers', [CustomerController::class, 'fetch']);
    Route::get('/fetch-payment-options', [PaymentOptionController::class, 'fetch']);

    Route::get('/returns', [ReturnController::class, 'index']);
    Route::get('/fetch-return-options', [ReturnController::class, 'fetchOptions']);
    Route::post('/returns-confirm', [ReturnController::class, 'confirm']);
    Route::get('/returns/summary', [ReturnController::class, 'summary']);
    Route::post('/returns/delete', [ReturnController::class, 'destroy']);
    
    Route::get('/expenses', [ExpensesController::class, 'index']);
    Route::get('/expenses/names', [ExpensesController::class, 'names']);
    Route::post('/expenses/store', [ExpensesController::class, 'store']);
    Route::post('/expenses/delete', [ExpensesController::class, 'destroy']);

    Route::get('/users', [UsersController::class, 'index']);
    Route::get('/users/roles', [UsersController::class, 'roles']);
});