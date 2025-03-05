<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PaymentOption;
use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Sale;
use App\Models\SalesPayment;
use App\Models\SalesProduct;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
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

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'date_time_of_sale' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'total_cost' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'total_qty' => 'required|integer|min:0',
            'total_discount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
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
            'products.*.quantity' => 'required|integer|min:1',
            'products.*.amount' => 'required|numeric|min:0',
            'products.*.totalCost' => 'required|numeric|min:0',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_name = $user->name;
            $cashier_id = $user->id;
            $code = $this->getCode();
            $customer_id = $this->getCustomerId($validatedData['customer_name']);
            
            $sale = Sale::create([
                'date_time_of_sale' => $validatedData['date_time_of_sale'],
                'customer_id' => $customer_id,
                'customer_name' => $validatedData['customer_name'],
                'code' => $code,
                'total_cost' => $validatedData['total_cost'],
                'total_price' => $validatedData['total_price'],
                'total_discount' => $validatedData['total_discount'],
                'total_qty' => $validatedData['total_qty'],
                'total_amount' => $validatedData['total_amount'],
                'amount_paid' => 0.00,
                'amount_change' => 0.00,
                'cashier_id' => $cashier_id,
                'cashier_name' => $cashier_name,            
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            foreach ($validatedData['paymentOptions'] as $payment) {
                SalesPayment::create([
                    'sale_id' => $sale->id,
                    'payment_option_id' => $payment['payment_option_id'],
                    'payment_option_name' => $payment['payment_option_name'],
                    'amount' => $payment['amount'],
                    'amount_paid' => $payment['amount_paid'],
                    'amount_change' => $payment['amount_change'] >= 0 ? $payment['amount_change'] : 0.00,
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id
                ]);
            }

            // Save Products
            foreach ($validatedData['products'] as $product) {
                if($product['discount']>0){
                    $discountPercentage = ($product['discount'] / $product['price']) * 100;

                    $discountPercentage = round($discountPercentage);
                }else{
                    $discountPercentage = 0.00;
                }

                SalesProduct::create([
                    'sale_id' => $sale->id,
                    'sale_code' => $sale->code,
                    'product_id' => $product['id'],
                    'total_cost' => $product['totalCost'],
                    'cost' => $product['cost'],                
                    'price' => $product['price'],
                    'discount_amount' => $product['discount'],
                    'discount_percentage' => $discountPercentage,
                    'qty' => $product['quantity'],
                    'amount' => $product['amount'],
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id
                ]);

                $productPrice = ProductsPrice::where('product_id', $product['id'])
                    ->where('price', $product['price'])
                    ->first();

                if ($productPrice) {
                    $newQuantity = max(0, $productPrice->qty - $product['quantity']);

                    $productPrice->update(['qty' => $newQuantity]);
                }

                $totalStock = ProductsPrice::where('product_id', $product['id'])->sum('qty');
                Product::where('id', $product['id'])->update(['qty' => $totalStock]);
            }

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

    public function fetch(Request $request)
    {
        $query = Sale::with('productsList.productInfo');

        // if ($request->has('search') && !empty($request->search)) {
        //     $search = $request->search;
        //     $query->where('code', 'LIKE', "%{$search}%");
        //     $query->orWhere('total_amount', 'LIKE', "%{$search}%");
        // }

        $sales = $query->orderBy('date_time_of_sale','DESC')->limit(10)->get();

        return response()->json($sales);
    }

    private function getCode()
    {
        $today = now()->format('ymd');

        $lastSaleToday = Sale::where('code', 'LIKE', "INV-$today-%")->orderByDesc('code')->first();

        if ($lastSaleToday && preg_match('/INV-\d{6}-(\d+)/', $lastSaleToday->code, $matches)) {
            $newSaleNumber = intval($matches[1]) + 1;
        } else {
            $newSaleNumber = 1;
        }

        $saleCode = "INV-$today-" . str_pad($newSaleNumber, 5, '0', STR_PAD_LEFT);

        return $saleCode;
    }
    private function getCustomerId($customer_name)
    {
        $customer = Customer::firstOrCreate(['name' => $customer_name]);
        return $customer->id;
    }
}