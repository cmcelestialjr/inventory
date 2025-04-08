<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PaymentOption;
use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Sale;
use App\Models\SalesPayment;
use App\Models\SalesProduct;
use App\Models\SalesStatus;
use App\Services\SaleServices;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    protected $saleService;

    public function __construct(SaleServices $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index(Request $request)
    {
        $query = Sale::with('paymentOptions.paymentOptionInfo','productsList.productInfo');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'LIKE', "%{$search}%")
                ->orWhere('code', 'LIKE', "%{$search}%")
                ->orWhere('cashier_name', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->whereBetween(DB::raw('DATE(date_time_of_sale)'), [$startDate, $endDate]);
            }
        }

        if ($request->has('filter')){
            $filter = $request->filter;
            if($filter!="all"){
                $query->where('sales_status_id', $filter);
            }
        }


        $sales = $query->orderByDesc('date_time_of_sale')->paginate(10);

        return response()->json([
            'data' => $sales->items(),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'prev' => $sales->previousPageUrl(),
                'next' => $sales->nextPageUrl(),
            ]
        ]);
    }

    public function salesStatuses(Request $request)
    {
        try {
            
            $query = SalesStatus::withCount(['sales' => function ($q) use ($request) {
                if ($request->has('start_date') && $request->has('end_date')) {
                    $startDate = $request->start_date;
                    $endDate = $request->end_date;                    
                    $q->whereBetween(DB::raw('DATE(date_time_of_sale)'), [$startDate, $endDate]);
                }
            }]);
            
            $salesStatus = $query->orderBy('id','ASC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $salesStatus
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales statuses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirmSale(Request $request)
    {
        $validatedData = $request->validate([
            'saleId' => 'nullable|exists:sales,id',
            'date_time_of_sale' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'total_cost' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'total_qty' => 'required|numeric|min:0',
            'total_discount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'saleStatus' => 'required|exists:sales_statuses,id',
            'paymentOptions' => 'required|array|min:1',
            'paymentOptions.*.payment_option_id' => 'required|integer',
            'paymentOptions.*.payment_option_name' => 'required|string|max:255',
            'paymentOptions.*.amount' => 'required|numeric|min:0',
            'paymentOptions.*.amount_paid' => 'required|numeric|min:0',
            'paymentOptions.*.amount_change' => 'required|numeric',
            'products' => 'required|array|min:1',
            'products.*.id' => 'required|integer|exists:products,id',
            'products.*.name' => 'required|string|max:255',
            'products.*.cost' => 'required|numeric|min:0',
            'products.*.price' => 'required|numeric|min:0',
            'products.*.discount' => 'required|numeric|min:0',
            'products.*.quantity' => 'required|numeric|min:1',
            'products.*.amount' => 'required|numeric|min:0',
            'products.*.totalCost' => 'required|numeric|min:0',
        ]);

        if($validatedData['saleId']){
            return $this->update($validatedData);
        }else{
            return $this->store($validatedData);
        }
    }

    private function store($validatedData)
    {
        try{
            DB::beginTransaction();

            $saleStatus = $validatedData['saleStatus'];
            $this->saleService->insertSale($validatedData, $saleStatus);

            DB::commit();
            return response()->json(['message' => 'Sale confirmed successfully'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function update($validatedData)
    {
        $sale = Sale::findOrFail($validatedData['saleId']);

        try{
            DB::beginTransaction();

            $saleStatus = $validatedData['saleStatus'];
            $this->saleService->updateSale($sale,$validatedData, $saleStatus);

            DB::commit();
            return response()->json(['message' => 'Sale confirmed successfully'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function proceedPayment(Request $request)
    {
        $validatedData = $request->validate([
            'date_time_of_sale' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'total_cost' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'total_qty' => 'required|numeric|min:0',
            'total_discount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'products' => 'required|array|min:1',
            'products.*.id' => 'required|integer|exists:products,id',
            'products.*.name' => 'required|string|max:255',
            'products.*.cost' => 'required|numeric|min:0',
            'products.*.price' => 'required|numeric|min:0',
            'products.*.discount' => 'required|numeric|min:0',
            'products.*.quantity' => 'required|numeric|min:1',
            'products.*.amount' => 'required|numeric|min:0',
            'products.*.totalCost' => 'required|numeric|min:0',
        ]);

        try{
            DB::beginTransaction();
            
            $saleStatus = 1;
            $getSale = $this->saleService->insertSale($validatedData, $saleStatus);
            $code = $getSale->code;

            DB::commit();
            return response()->json([
                'message' => 'Sale confirmed successfully!',
                'code' => $code
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function fetch(Request $request)
    {
        $query = Sale::with('productsList.productInfo');

        // if ($request->has('search') && !empty($request->search)) {
        //     $search = $request->search;
        //     $query->where('code', 'LIKE', "%{$search}%");
        //     $query->orWhere('total_amount', 'LIKE', "%{$search}%");
        // }

        $sales = $query->orderBy('date_time_of_sale','DESC')->limit(10)->get();

        $sales->transform(function ($sale) {
            $product = $sale->productsList->first();
            
            $product->productInfo->img = $product && $product->productInfo && $product->productInfo->img
                        ? asset("storage/{$product->productInfo->img}")
                        : asset('images/no-image-icon.png');
        
            return $sale;
        });

        return response()->json($sales);
    }    
}