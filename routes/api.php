<?php

use App\Http\Controllers\AdvancesController;
use App\Http\Controllers\AdvanceStatusController;
use App\Http\Controllers\AttendancesController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DamagedController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EarningTypesController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeDeductionController;
use App\Http\Controllers\EmployeeDeductionPeriodController;
use App\Http\Controllers\EmployeeOtherEarningsController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\EmployeeServicesRateController;
use App\Http\Controllers\ExpensesCategoriesController;
use App\Http\Controllers\ExpensesController;
use App\Http\Controllers\ExpensesSubCategoriesController;
use App\Http\Controllers\PaymentOptionController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollDeductionController;
use App\Http\Controllers\PayrollOtherEarningsController;
use App\Http\Controllers\PayrollPdfController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ScheduleTypesController;
use App\Http\Controllers\ServicesController;
use App\Http\Controllers\ServiceTransactionsController;
use App\Http\Controllers\SuppliersController;
use App\Http\Controllers\UsersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/pos/transactions', [PosController::class, 'transactions']);

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
    Route::get('/fetch-pos-products', [ProductController::class, 'posFetch']);    
    Route::post('/product/category/code', [ProductController::class, 'categoryCode']);
    Route::post('/products/upload', [ProductController::class, 'upload']);
    Route::get('/products/categoriesCount', [ProductController::class, 'categoriesCount']);
    Route::get('/products/print', [ProductController::class, 'print']);
    Route::post('/product/update-image', [ProductController::class, 'updateImage']);
    Route::get('/products/pricing/delete', [ProductController::class, 'pricingDestroy']);
    Route::get('/products/sales', [ProductController::class, 'sales']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales-confirm', [SaleController::class, 'confirmSale']);
    Route::post('/sales-proceed-payment', [SaleController::class, 'proceedPayment']);
    Route::get('/fetch-sales', [SaleController::class, 'fetch']);
    Route::get('/fetch-sales-statuses', [SaleController::class, 'salesStatuses']);
    Route::get('/sales/remove-product', [SaleController::class, 'removeProduct']);
    
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
    Route::get('/suppliers/delete', [SuppliersController::class, 'destroy']);

    Route::get('/services', [ServicesController::class, 'index']);
    Route::post('/services/manage', [ServicesController::class, 'manage']);
    Route::get('/services/removeProduct', [ServicesController::class, 'removeProduct']);
    Route::get('/services/statusTotal', [ServicesController::class, 'statusTotal']);
    Route::get('/fetch-services', [ServicesController::class, 'fetch']);
    
    Route::get('/service-transactions', [ServiceTransactionsController::class, 'index']);
    Route::post('/service-transactions/manage', [ServiceTransactionsController::class, 'manage']);
    Route::get('/service-transactions/removeProduct', [ServiceTransactionsController::class, 'removeProduct']);
    Route::get('/service-transactions/removeProduct1', [ServiceTransactionsController::class, 'removeProduct1']);
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
    
    Route::get('/employee/salary/{id}', [EmployeeController::class, 'updateSalary']);
    Route::get('/employees/totals', [EmployeeController::class, 'getTotals']);
    Route::get('/employees/search', [EmployeeController::class, 'search']);
    Route::apiResource('employees', EmployeeController::class);

    Route::get('/schedule-pay-types/fetch', [ScheduleTypesController::class, 'fetch']);
    Route::get('/employee/schedule/index', [EmployeeScheduleController::class, 'index']);
    Route::post('/employee/schedule/update', [EmployeeScheduleController::class, 'update']);    

    Route::apiResource('employee-services-rate', EmployeeServicesRateController::class);

    Route::post('/payroll/listEmployee', [PayrollController::class, 'listEmployee']);
    Route::post('/payroll/updateEarned', [PayrollController::class, 'updateEarned']);
    Route::apiResource('payroll', PayrollController::class);

    Route::apiResource('payrollDeduction', PayrollDeductionController::class);
    
    Route::apiResource('deductions', DeductionController::class);
    
    Route::post('/updateEmployeeDeductions', [EmployeeDeductionController::class, 'udpateDeduction']);
    Route::apiResource('employeeDeductions', EmployeeDeductionController::class);

    Route::apiResource('employeeDeductionPeriods', EmployeeDeductionPeriodController::class);

    Route::apiResource('advanceStatuses', AdvanceStatusController::class);

    Route::apiResource('advances', AdvancesController::class);

    Route::post('/payroll-generate-pdf', [PayrollPdfController::class, 'index']);

    Route::get('/earning-types/fetch', [EarningTypesController::class, 'fetch']);
    Route::apiResource('earning-types', EarningTypesController::class);

    Route::apiResource('employee-other-earnings', EmployeeOtherEarningsController::class);

    Route::apiResource('payroll-other-earnings', PayrollOtherEarningsController::class);

    Route::apiResource('attendances', AttendancesController::class);
});