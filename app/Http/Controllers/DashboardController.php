<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Returns;
use App\Models\Sale;
use App\Models\SalesProduct;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function topSection(Request $request)
    {
        $validated = $request->validate([
            'selected' => ['required', 'string', 'in:today,last_10_days,this_month,last_month,this_year,custom'],
            'startDate' => ['nullable', 'date', 'before_or_equal:endDate'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate'],
        ]);
        
        $selected = $request->selected;
        $startDate = $request->startDate ? Carbon::parse($request->startDate) : null;
        $endDate = $request->endDate ? Carbon::parse($request->endDate) : null;

        $getSales = DB::table('sales')->where('sales_status_id',1);
        $getReturns = DB::table('returns');
        $getExpenses = DB::table('expenses');
        $getServices = DB::table('service_transaction_payments');
        $getReceivables = DB::table('service_transactions')->whereIn('service_status_id',[1,2,3]);
        $getServiceProducts = DB::table('service_transaction_products')
            ->join('service_transactions', 'service_transaction_products.service_transaction_id', '=', 'service_transactions.id')
            ->whereIn('service_transactions.service_status_id',[1,2,3]);

        switch ($selected) {
            case "last_10_days":
                $getSales->whereBetween('date_time_of_sale', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                $getReturns->whereBetween('date_time_returned', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                $getExpenses->whereBetween('date_time_of_expense', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                $getServices->whereBetween('payment_date', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                $getReceivables->whereBetween('created_at', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                $getServiceProducts->whereBetween('service_transactions.created_at', [now()->subDays(9)->startOfDay(), now()->endOfDay()]);
                break;
            case "this_month":
                $getSales->whereBetween('date_time_of_sale', [now()->startOfMonth(), now()->endOfMonth()]);
                $getReturns->whereBetween('date_time_returned', [now()->startOfMonth(), now()->endOfMonth()]);
                $getExpenses->whereBetween('date_time_of_expense', [now()->startOfMonth(), now()->endOfMonth()]);
                $getServices->whereBetween('payment_date', [now()->startOfMonth(), now()->endOfMonth()]);
                $getReceivables->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                $getServiceProducts->whereBetween('service_transactions.created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                break;
            case "last_month":
                $lastMonthStart = now()->subMonth()->startOfMonth();
                $lastMonthEnd = now()->subMonth()->endOfMonth();
                $getSales->whereBetween('date_time_of_sale', [$lastMonthStart, $lastMonthEnd]);
                $getReturns->whereBetween('date_time_returned', [$lastMonthStart, $lastMonthEnd]);
                $getExpenses->whereBetween('date_time_of_expense', [$lastMonthStart, $lastMonthEnd]);
                $getServices->whereBetween('payment_date', [$lastMonthStart, $lastMonthEnd]);
                $getReceivables->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd]);
                $getServiceProducts->whereBetween('service_transactions.created_at', [$lastMonthStart, $lastMonthEnd]);
                break;
            case "this_year":
                $getSales->whereYear('date_time_of_sale', now()->year);
                $getReturns->whereYear('date_time_returned', now()->year);
                $getExpenses->whereYear('date_time_of_expense', now()->year);
                $getServices->whereYear('payment_date', now()->year);
                $getReceivables->whereYear('created_at', now()->year);
                $getServiceProducts->whereYear('service_transactions.created_at', now()->year);
                break;
            case "custom":
                if ($startDate && $endDate) {
                    $getSales->whereBetween('date_time_of_sale', [$startDate, $endDate]);
                    $getReturns->whereBetween('date_time_returned', [$startDate, $endDate]);
                    $getExpenses->whereBetween('date_time_of_expense', [$startDate, $endDate]);
                    $getServices->whereBetween('payment_date', [$startDate, $endDate]);
                    $getReceivables->whereBetween('created_at', [$startDate, $endDate]);
                    $getServiceProducts->whereBetween('service_transactions.created_at', [$startDate, $endDate]);
                }
                break;
            default:
                $getSales->whereDate('date_time_of_sale', now());
                $getReturns->whereDate('date_time_returned', now());
                $getExpenses->whereDate('date_time_of_expense', now());
                $getServices->whereDate('payment_date', now());
                $getReceivables->whereDate('created_at', now());
                $getServiceProducts->whereDate('service_transactions.created_at', now());
        }

        $salesData = $getSales->selectRaw("
            COALESCE(SUM(total_amount), 0) as total_amount, 
            COALESCE(SUM(total_cost), 0) as total_cost
        ")->first();

        $returnsData = $getReturns->selectRaw("
            COALESCE(SUM(total_amount), 0) as total_amount
        ")->first();

        $expensesData = $getExpenses->selectRaw("
            COALESCE(SUM(amount), 0) as total_amount
        ")->first();

        $servicesData = $getServices->selectRaw("
            COALESCE(SUM(amount), 0) as total_amount
        ")->first();

        $receivablesData = $getReceivables->selectRaw("
            COALESCE(SUM(remaining), 0) as total_amount
        ")->first();

        $serviceProductsCostData = $getServiceProducts->selectRaw("
            COALESCE(SUM(total), 0) as total_amount
        ")->first();


        $totalSales = $salesData->total_amount;
        $totalCost = $salesData->total_cost;
        $totalReturns = $returnsData->total_amount;
        $totalExpenses = $expensesData->total_amount;
        $totalServices = $servicesData->total_amount;
        $totalReceivables = $receivablesData->total_amount;
        $totalServiceProductsCost = $serviceProductsCostData->total_amount;
        
        $totalIncome = $totalSales + $totalServices + $totalReceivables - $totalCost - $totalServiceProductsCost - $totalReturns - $totalExpenses;

        return response()->json([
            'totalSales' => number_format($totalSales,2),
            'totalServices' => number_format($totalServices,2),
            'totalCost' => number_format($totalCost,2),
            'totalReturns' => number_format($totalReturns,2),
            'totalExpenses' => number_format($totalExpenses,2),
            'totalReceivables' => number_format($totalReceivables,2),
            'totalIncome' => number_format($totalIncome,2),
        ], 200);
    }

    public function middleSection(Request $request)
    {
        $validated = $request->validate([
            'selected' => [
                'required',
                'string',
                'in:today,last_10_days,this_month,first_qtr,second_qtr,third_qtr,fourth_qtr,first_sem,second_sem,this_year_monthly,this_year_qtr,last_3_years,last_5_years,last_7_years'
            ]
        ]);

        $selected = $request->selected;

        $getSales = DB::table('sales')->where('sales_status_id',1);
        $getExpenses = DB::table('expenses');
        $getSellingProducts = $this->getSellingProducts();
        
        
        switch ($selected) {
            case "last_10_days":
                $salesTrends = $this->getByDays($getSales, 10, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByDays($getExpenses, 10, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByDaysSellingProducts($getSellingProducts);
                break;
            case "this_month":                
                $salesTrends = $this->getByThisMonth($getSales, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByThisMonth($getExpenses, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByThisMonthSellingProducts($getSellingProducts);
                break;
            case "first_qtr":
                $salesTrends = $this->getByQtr($getSales, 'first_qtr', 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByQtr($getExpenses, 'first_qtr', 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByQtrSellingProducts($getSellingProducts,"first_qtr");
                break;
            case "second_qtr":
                $salesTrends = $this->getByQtr($getSales, 'second_qtr', 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByQtr($getExpenses, 'second_qtr', 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByQtrSellingProducts($getSellingProducts,"second_qtr");
                break;
            case "third_qtr":
                $salesTrends = $this->getByQtr($getSales, 'third_qtr', 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByQtr($getExpenses, 'third_qtr', 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByQtrSellingProducts($getSellingProducts,"third_qtr");
                break;                
            case "fourth_qtr":
                $salesTrends = $this->getByQtr($getSales, 'fourth_qtr', 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByQtr($getExpenses, 'fourth_qtr', 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByQtrSellingProducts($getSellingProducts,"fourth_qtr");
                break;
            case "first_sem":
                $salesTrends = $this->getBySem($getSales, 1, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getBySem($getExpenses, 1, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getBySemSellingProducts($getSellingProducts,1);
                break;
            case "second_sem":
                $salesTrends = $this->getBySem($getSales, 2, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getBySem($getExpenses, 2, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getBySemSellingProducts($getSellingProducts,2);
                break;
            case "this_year_monthly":
                $salesTrends = $this->getThisYearMonthly($getSales, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getThisYearMonthly($getExpenses, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByThisYearSellingProducts($getSellingProducts);
                break;
            case "this_year_qtr":
                $salesTrends = $this->getThisYearQtr($getSales, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getThisYearQtr($getExpenses, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByThisYearSellingProducts($getSellingProducts);
                break;
            case "last_3_years":
                $salesTrends = $this->getByLastAboutYears($getSales, 3, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByLastAboutYears($getExpenses, 3, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByLastAboutYearsSellingProducts($getSellingProducts,3);
                break;
            case "last_5_years":
                $salesTrends = $this->getByLastAboutYears($getSales, 5, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByLastAboutYears($getExpenses, 5, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByLastAboutYearsSellingProducts($getSellingProducts,5);
                break;
            case "last_7_years":
                $salesTrends = $this->getByLastAboutYears($getSales, 7, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByLastAboutYears($getExpenses, 7, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByLastAboutYearsSellingProducts($getSellingProducts,7);
                break;
            default:
                $salesTrends = $this->getByDays($getSales, 5, 'date_time_of_sale', 'total_amount');
                $expensesTrends = $this->getByDays($getExpenses, 5, 'date_time_of_expense', 'amount');
                $sellingProducts = $this->getByDaysSellingProducts($getSellingProducts);
        }

        $topSellingProducts = (clone $sellingProducts)->orderBy('value', 'desc')->get();
        $leastSellingProducts = (clone $sellingProducts)->orderBy('value', 'asc')->get();

        return response()->json([
            'salesTrends' => $salesTrends,
            'expensesTrends' => $expensesTrends,
            'topSellingProducts' => $topSellingProducts,
            'leastSellingProducts' => $leastSellingProducts
        ], 200);
    }

    public function bottomSection()
    {
        $recentSales = Sale::where('sales_status_id',1)->orderBy('date_time_of_sale', 'desc')->limit(10)->get();
        $recentRestocks = Product::orderBy('restock_date', 'desc')->limit(10)->get();
        $recentExpenses = Expense::orderBy('date_time_of_expense', 'desc')->limit(10)->get();
        $recentReturns = Returns::orderBy('date_time_returned', 'desc')->limit(10)->get();

        return response()->json([
            'recentSales' => $recentSales,
            'recentRestocks' => $recentRestocks,
            'recentExpenses' => $recentExpenses,
            'recentReturns' => $recentReturns
        ], 200);
    }

    private function getSellingProducts()
    {
        return DB::table('sales_products')->selectRaw('
                sales_products.product_id, 
                SUM(sales_products.qty) as value,
                SUM(sales_products.amount) as total_amount,
                products.name, 
                sales_products.price
            ')
            ->join('sales', 'sales_products.sale_id', '=', 'sales.id')
            ->join('products', 'sales_products.product_id', '=', 'products.id')
            ->where('sales.sales_status_id',1)
            ->groupBy('sales_products.product_id', 'products.name', 'sales_products.price')
            ->limit(5);
    }

    private function getProductsWithNoSales()
    {
        return DB::table('products')
            ->leftJoin('sales_products', 'products.id', '=', 'sales_products.product_id')
            ->leftJoin('sales', 'sales_products.sale_id', '=', 'sales.id')
            ->select('products.id', 'products.name', 'products.price')
            ->whereNull('sales_products.product_id')
            ->orWhere(function ($query) {
                $query->whereNotNull('sales.id') 
                      ->where('sales.sales_status_id', '!=', 1);
            })
            ->limit(5)
            ->get();
    }
    
    private function getByDays($query, $days, $columnDateTime, $columnTotalAmount)
    {
        $query->whereBetween($columnDateTime, [now()->subDays($days - 1)->startOfDay(), now()->endOfDay()]);
        $queryData = $query->selectRaw('
            DATE('.$columnDateTime.') as date, 
            DAYNAME('.$columnDateTime.') as name, 
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('date', 'name')
        ->orderBy('date', 'asc')
        ->pluck('value', 'date');

        $allDays = [];
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i)->format('Y-m-d');
            $dayName = now()->subDays($days - 1 - $i)->format('l');
            
            $allDays[] = [
                'name' => $dayName,
                'value' => $queryData[$date] ?? 0 
            ];
        }

        return $allDays;
    }

    private function getByDaysSellingProducts($getSellingProducts)
    {
        return $getSellingProducts->whereDate('sales.date_time_of_sale', now());
    }

    private function getByThisMonth($query, $columnDateTime, $columnTotalAmount)
    {
        $query->whereBetween($columnDateTime, [now()->startOfMonth(), now()->endOfMonth()]);

        $queryData = $query->selectRaw('
                WEEK('.$columnDateTime.', 1) - WEEK(DATE_SUB('.$columnDateTime.', INTERVAL DAYOFMONTH('.$columnDateTime.')-1 DAY), 1) + 1 as week_number, 
                CONCAT("Week ", WEEK('.$columnDateTime.', 1) - WEEK(DATE_SUB('.$columnDateTime.', INTERVAL DAYOFMONTH('.$columnDateTime.')-1 DAY), 1) + 1) as name, 
                SUM('.$columnTotalAmount.') as value
            ')
            ->groupBy('week_number', 'name')
            ->orderBy('week_number', 'asc')
            ->pluck('value', 'name');

        $weeks = [];
        $startDate = now()->startOfMonth();
        $endDate = now()->endOfMonth();
        
        $weekIndex = 1;
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addWeek()) {
            $weekName = 'Week ' . $weekIndex;
            $weeks[] = [
                'name' => $weekName,
                'value' => $queryData[$weekName] ?? 0 
            ];
            $weekIndex++;
        }
        return array_values($weeks);
    }

    private function getByThisMonthSellingProducts($getSellingProducts)
    {
        return $getSellingProducts->whereBetween('sales.date_time_of_sale', 
            [now()->startOfMonth(), now()->endOfMonth()]);
    }
    
    private function getByQtr($query, $qtr, $columnDateTime, $columnTotalAmount)
    {
        $quarters = [
            'first_qtr' => [1, 3], 
            'second_qtr' => [4, 6],  
            'third_qtr' => [7, 9], 
            'fourth_qtr' => [10, 12] 
        ];
    
        [$startMonth, $endMonth] = $quarters[$qtr];
    
        $query->whereBetween($columnDateTime, [
            now()->startOfYear()->month($startMonth)->startOfMonth(),
            now()->startOfYear()->month($endMonth)->endOfMonth()
        ]);
        
        $queryData = $query->selectRaw('
            MONTH('.$columnDateTime.') as month_number,
            MONTHNAME('.$columnDateTime.') as name, 
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('month_number', 'name')
        ->orderByRaw('MIN('.$columnDateTime.') ASC')
        ->pluck('value', 'month_number');
    
        $allMonths = [];
        for ($m = $startMonth; $m <= $endMonth; $m++) {
            $allMonths[] = [
                'name' => date('F', mktime(0, 0, 0, $m, 1)), 
                'value' => $queryData[$m] ?? 0
            ];
        }
    
        return $allMonths;
    }

    private function getByQtrSellingProducts($getSellingProducts,$qtr)
    {
        $quarters = [
            'first_qtr' => [1, 3], 
            'second_qtr' => [4, 6],  
            'third_qtr' => [7, 9], 
            'fourth_qtr' => [10, 12] 
        ];
    
        [$startMonth, $endMonth] = $quarters[$qtr];

        return $getSellingProducts->whereBetween('sales.date_time_of_sale', [
                now()->startOfYear()->month($startMonth)->startOfMonth(),
                now()->startOfYear()->month($endMonth)->endOfMonth()
            ]);
    }

    private function getBySem($query, $sem, $columnDateTime, $columnTotalAmount)
    {
        $months = ($sem == 1) 
            ? [1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'May', 6 => 'Jun']
            : [7 => 'Jul', 8 => 'Aug', 9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'];

        if ($sem == 1) {
            $query->whereBetween($columnDateTime, [
                now()->startOfYear(), 
                now()->startOfYear()->addMonths(5)->endOfMonth()
            ]);
        } else {
            $query->whereBetween($columnDateTime, [
                now()->startOfYear()->addMonths(6)->startOfMonth(), 
                now()->endOfYear()
            ]);
        }

        $queryData = $query->selectRaw('
            MONTH('.$columnDateTime.') as month_number,
            MONTHNAME('.$columnDateTime.') as name, 
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('month_number', 'name')
        ->orderBy('month_number', 'asc')
        ->get()
        ->keyBy('month_number'); 

        $queryTrends = [];
        foreach ($months as $num => $name) {
            $queryTrends[] = [
                'month_number' => $num,
                'name' => $name,
                'value' => $queryData[$num]->value ?? 0 
            ];
        }

        return $queryTrends;
    }

    private function getBySemSellingProducts($getSellingProducts,$sem)
    {
        if ($sem == 1) {
            $getSellingProducts->whereBetween('sales.date_time_of_sale', [
                now()->startOfYear(), 
                now()->startOfYear()->addMonths(5)->endOfMonth()
            ]);
        } else {
            $getSellingProducts->whereBetween('sales.date_time_of_sale', [
                now()->startOfYear()->addMonths(6)->startOfMonth(), 
                now()->endOfYear()
            ]);
        }
        return $getSellingProducts;
    }

    private function getThisYearMonthly($query, $columnDateTime, $columnTotalAmount)
    {
        $months = [1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug', 9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'];

        $query->whereBetween($columnDateTime, [
            now()->startOfYear()->startOfMonth(), 
            now()->endOfYear()->endOfMonth()
        ]);

        $queryData = $query->selectRaw('
            MONTH('.$columnDateTime.') as month_number,
            MONTHNAME('.$columnDateTime.') as name, 
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('month_number', 'name')
        ->orderBy('month_number', 'asc')
        ->get()
        ->keyBy('month_number'); 

        $queryTrends = [];
        foreach ($months as $num => $name) {
            $queryTrends[] = [
                'month_number' => $num,
                'name' => $name,
                'value' => $queryData[$num]->value ?? 0 
            ];
        }

        return $queryTrends;
    }

    private function getThisYearQtr($getSales, $columnDateTime, $columnTotalAmount)
    {
        $getSales->whereYear($columnDateTime, now()->year);
        $salesData = $getSales->selectRaw('
            CASE 
                WHEN MONTH('.$columnDateTime.') BETWEEN 1 AND 3 THEN "First Quarter"
                WHEN MONTH('.$columnDateTime.') BETWEEN 4 AND 6 THEN "Second Quarter"
                WHEN MONTH('.$columnDateTime.') BETWEEN 7 AND 9 THEN "Third Quarter"
                ELSE "Fourth Quarter"
            END as name, 
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('name')
        ->orderByRaw('FIELD(name, "First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter")')
        ->pluck('value', 'name');

        $quarters = [
            "First Qtr" => 0,
            "Second Qtr" => 0,
            "Third Qtr" => 0,
            "Fourth Qtr" => 0
        ];

        foreach ($salesData as $quarter => $value) {
            $quarters[$quarter] = $value;
        }

        $formattedData = [];
        foreach ($quarters as $name => $value) {
            $formattedData[] = [
                'name' => $name,
                'value' => $value
            ];
        }

        return $formattedData;
    }

    private function getByThisYearSellingProducts($getSellingProducts)
    {
        return $getSellingProducts->whereYear('sales.date_time_of_sale', now()->year);
    }

    private function getByLastAboutYears($query, $years, $columnDateTime, $columnTotalAmount)
    {
        $query->whereBetween($columnDateTime, [now()->subYears($years-1)->startOfYear(), now()->endOfYear()]);
        $query->selectRaw('
            YEAR('.$columnDateTime.') as name,
            SUM('.$columnTotalAmount.') as value
        ')
        ->groupBy('name')
        ->orderByRaw('name ASC');
        $queryData = $query->get();

        $fullData = [];
        $startYear = now()->year - ($years - 1);
        $endYear = now()->year;

        for ($y = $startYear; $y <= $endYear; $y++) {
            $fullData[$y] = [
                'name' => $y,
                'value' => 0,
            ];
        }

        foreach ($queryData as $row) {
            $fullData[$row->name]['value'] = $row->value;
        }

        return array_values($fullData);
    }

    private function getByLastAboutYearsSellingProducts($getSellingProducts,$years)
    {
        return $getSellingProducts->whereBetween('sales.date_time_of_sale', 
            [now()->subYears($years-1)->startOfYear(), now()->endOfYear()]);
    }

    
}