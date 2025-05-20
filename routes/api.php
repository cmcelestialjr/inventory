<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DamagedController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpensesCategoriesController;
use App\Http\Controllers\ExpensesController;
use App\Http\Controllers\ExpensesSubCategoriesController;
use App\Http\Controllers\PaymentOptionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ServicesController;
use App\Http\Controllers\ServiceTransactionsController;
use App\Http\Controllers\SuppliersController;
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
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::put('/product-pricing/{id}', [ProductController::class, 'updatePricing']);
    Route::post('/product-pricing', [ProductController::class, 'storePricing']);
    Route::get('/fetch-products', [ProductController::class, 'fetch']);
    Route::post('/product/category/code', [ProductController::class, 'categoryCode']);
    Route::post('/products/upload', [ProductController::class, 'upload']);
    Route::get('/products/categoriesCount', [ProductController::class, 'categoriesCount']);
    Route::get('/products/print', [ProductController::class, 'print']);
    Route::post('/product/update-image', [ProductController::class, 'updateImage']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales-confirm', [SaleController::class, 'confirmSale']);
    Route::post('/sales-proceed-payment', [SaleController::class, 'proceedPayment']);
    Route::get('/fetch-sales', [SaleController::class, 'fetch']);
    Route::get('/fetch-sales-statuses', [SaleController::class, 'salesStatuses']);
    
    Route::get('/fetch-customers', [CustomerController::class, 'fetch']);
    Route::get('/fetch-payment-options', [PaymentOptionController::class, 'fetch']);
    Route::get('/fetch-payment-statuses', [PaymentOptionController::class, 'fetchStatuses']);

    Route::get('/returns', [ReturnController::class, 'index']);
    Route::get('/fetch-return-options', [ReturnController::class, 'fetchOptions']);
    Route::post('/returns-confirm', [ReturnController::class, 'confirm']);
    Route::get('/returns/summary', [ReturnController::class, 'summary']);
    Route::post('/returns/delete', [ReturnController::class, 'destroy']);
    Route::get('/fetch-returns', [ReturnController::class, 'fetch']);
    
    Route::get('/expenses', [ExpensesController::class, 'index']);
    Route::get('/expenses/names', [ExpensesController::class, 'names']);
    Route::post('/expenses/store', [ExpensesController::class, 'store']);
    Route::post('/expenses/delete', [ExpensesController::class, 'destroy']);

    Route::get('/expenses/categories', [ExpensesCategoriesController::class, 'index']);
    Route::get('/expenses/categories/fetch', [ExpensesCategoriesController::class, 'fetch']);
    Route::get('/expenses/categories/fetchAll', [ExpensesCategoriesController::class, 'fetchAll']);
    Route::post('/expenses/categories/manage', [ExpensesCategoriesController::class, 'manage']);

    Route::get('/expenses/subCategories', [ExpensesSubCategoriesController::class, 'index']);
    Route::get('/expenses/subCategories/fetch', [ExpensesSubCategoriesController::class, 'fetch']);
    Route::post('/expenses/subCategories/fetchByCategory', [ExpensesSubCategoriesController::class, 'fetchByCategory']);
    Route::post('/expenses/subCategories/manage', [ExpensesSubCategoriesController::class, 'manage']);

    Route::get('/users', [UsersController::class, 'index']);
    Route::get('/users/roles', [UsersController::class, 'roles']);
    Route::post('/users/store', [UsersController::class, 'store']);
    Route::put('/users/{id}', [UsersController::class, 'update']);    

    Route::get('/suppliers', [SuppliersController::class, 'index']);
    Route::post('/suppliers/manage', [SuppliersController::class, 'manage']);
    Route::get('/fetch-suppliers', [SuppliersController::class, 'fetch']);
    Route::get('/suppliers/removeContact', [SuppliersController::class, 'removeContact']);    

    Route::get('/services', [ServicesController::class, 'index']);
    Route::post('/services/manage', [ServicesController::class, 'manage']);
    Route::get('/services/removeProduct', [ServicesController::class, 'removeProduct']);
    Route::get('/services/statusTotal', [ServicesController::class, 'statusTotal']);
    Route::get('/fetch-services', [ServicesController::class, 'fetch']);
    
    Route::get('/service-transactions', [ServiceTransactionsController::class, 'index']);
    Route::post('/service-transactions/manage', [ServiceTransactionsController::class, 'manage']);
    Route::get('/service-transactions/removeProduct', [ServiceTransactionsController::class, 'removeProduct']);
    Route::get('/service-transactions/removePayment', [ServiceTransactionsController::class, 'removePayment']);
    Route::post('/service-status/save', [ServiceTransactionsController::class, 'statusSave']);
    Route::get('/fetch-service-statuses-count', [ServiceTransactionsController::class, 'serviceStatusCount']);
    Route::post('/service-transaction-payment/payment', [ServiceTransactionsController::class, 'payment']);
    Route::get('/fetch-service-statuses', [ServiceTransactionsController::class, 'serviceStatuses']);
    Route::post('/service-transaction/returned', [ServiceTransactionsController::class, 'returned']);

    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders/manage', [PurchaseOrderController::class, 'manage']);
    Route::get('/purchase-orders/removeProduct', [PurchaseOrderController::class, 'removeProduct']);
    Route::get('/purchase-orders/statuses', [PurchaseOrderController::class, 'statuses']);
    Route::get('/purchase-orders/payments', [PurchaseOrderController::class, 'payments']);
    Route::post('/purchase-orders/payment', [PurchaseOrderController::class, 'payment']);
    Route::post('/purchase-orders/manageStatus', [PurchaseOrderController::class, 'manageStatus']);

    Route::get('/damaged', [DamagedController::class, 'index']);
    Route::get('/damaged/fetch/statuses', [DamagedController::class, 'fetchStatuses']);
    Route::post('/damaged/manage', [DamagedController::class, 'manage']);
});