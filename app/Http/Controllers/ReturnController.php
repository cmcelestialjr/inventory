<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Returns;
use App\Models\ReturnsOption;
use App\Models\ReturnsSalesProduct;
use App\Models\Sale;
use App\Models\SalesPayment;
use App\Models\SalesProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = Returns::with('saleInfo','returnSalesProductsList.saleProductInfo.productInfo','changeSaleInfo.productsList','returnOptionInfo');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('sales_code', 'LIKE', "%{$search}%")
                ->orWhere('refund_amount', 'LIKE', "%{$search}%");
                $q->orWhere('sales_of_return_code', 'LIKE', "%{$search}%")
                ->orWhere('remarks', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->whereBetween(DB::raw('DATE(date_time_returned)'), [$startDate, $endDate]);
            }
        }

        if ($request->has('filter')){
            $filter = $request->filter;
            if($filter!="all"){
                $query->orWhere('return_option_id', $filter);
            }
        }

        $returns = $query->orderBy('code','DESC')->paginate(5);

        return response()->json([
            'data' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'prev' => $returns->previousPageUrl(),
                'next' => $returns->nextPageUrl(),
            ]
        ]);
    }

    public function summary()
    {
        $total = Returns::count();

        $perRefundOption = Returns::selectRaw("
                return_option_id,
                COUNT(*) as total
            ")
            ->groupBy('return_option_id')
            ->get();

        return response()->json([
            'total' => $total,
            'per_refund_option' => $perRefundOption
        ]);
    }

    public function fetchOptions()
    {
        try {
            $paymentOptions = ReturnsOption::withCount('returns')
                ->orderBy('id','ASC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $paymentOptions
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch return options',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirm(Request $request)
    {
        $validatedData = $request->validate([
            'date_time_of_sale' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'total_cost' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'total_qty' => 'required|integer|min:0',
            'total_discount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'changedTotalAmount' => 'required|numeric|min:0',
            'returnTotalAmount' => 'required|numeric|min:0',
            'refund_amount' => 'required|numeric|min:0',
            'sales_id' => 'required|numeric|min:0|exists:sales,id',
            'sales_code' => 'required|string|max:100',
            'return_option_id' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:255',
            'paymentOptions' => 'nullable|array|min:1',
            'paymentOptions.*.payment_option_id' => 'nullable|integer',
            'paymentOptions.*.payment_option_name' => 'nullable|string|max:255',
            'paymentOptions.*.amount' => 'nullable|numeric|min:0',
            'paymentOptions.*.amount_paid' => 'nullable|numeric|min:0',
            'paymentOptions.*.amount_change' => 'nullable|numeric',
            'returnProducts' => 'required|array|min:1',
            'returnProducts.*.id' => 'required|integer|exists:sales_products,id',
            'returnProducts.*.qty' => 'required|numeric|min:0',
            'returnProducts.*.cost' => 'required|numeric|min:0',
            'returnProducts.*.price' => 'required|numeric|min:0',
            'returnProducts.*.amount' => 'required|numeric|min:0',
            'returnProducts.*.product_id' => 'required|numeric|min:0|exists:products,id',
            'changedProducts' => 'nullable|array',
            'changedProducts.*.id' => 'required|integer|exists:products,id',
            'changedProducts.*.name' => 'required|string|max:255',
            'changedProducts.*.cost' => 'required|numeric|min:0',
            'changedProducts.*.price' => 'required|numeric|min:0',
            'changedProducts.*.discount' => 'required|numeric|min:0',
            'changedProducts.*.quantity' => 'required|integer|min:1',
            'changedProducts.*.amount' => 'required|numeric|min:0',
            'changedProducts.*.totalCost' => 'required|numeric|min:0',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_name = $user->name;
            $cashier_id = $user->id;
            $returnCode = $this->getReturnCode();

            $return = Returns::create([
                'code' => $returnCode,
                'sales_id' => $validatedData['sales_id'],
                'sales_code' => $validatedData['sales_code'],
                'return_option_id' => $validatedData['return_option_id'],
                'refund_amount' => $validatedData['refund_amount'],
                'total_amount' => $validatedData['returnTotalAmount'],
                'remarks' => $validatedData['remarks'],
                'date_time_returned' => $validatedData['date_time_of_sale'],
                'cashier_id' => $cashier_id,
                'cashier_name' => $cashier_name,
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            $return_id = $return->id;

            foreach ($validatedData['returnProducts'] as $return) {
                ReturnsSalesProduct::create([
                    'return_id' => $return_id,
                    'sales_products_id' => $return['id'],
                    'qty' => $return['qty'],
                    'cost' => $return['cost'],
                    'price' => $return['price'],
                    'amount' => $return['amount'],
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id
                ]);

                $productPrice = ProductsPrice::where('product_id', $return['product_id'])
                        ->where('price', $return['price'])
                        ->first();
    
                if ($productPrice) {
                    $newQuantity = max(0, $productPrice->qty + $return['qty']);
    
                    $productPrice->update(['qty' => $newQuantity]);
                }
    
                $totalStock = ProductsPrice::where('product_id', $return['product_id'])->sum('qty');
                Product::where('id', $return['id'])->update(['qty' => $totalStock]);
            }

            if(!empty($validatedData['changedProducts'])){
                $getCustomer = Sale::find($validatedData['sales_id']);
                $customer_id = $getCustomer->customer_id;
                $customer_name = $getCustomer->customer_name;
                $code = $this->getCode();
                $sale = Sale::create([
                    'date_time_of_sale' => $validatedData['date_time_of_sale'],
                    'customer_id' => $customer_id,
                    'customer_name' => $customer_name,
                    'code' => $code,
                    'total_cost' => $validatedData['total_cost'],
                    'total_price' => $validatedData['total_price'],
                    'total_discount' => $validatedData['total_discount'],
                    'total_qty' => $validatedData['total_qty'],
                    'total_amount' => $validatedData['changedTotalAmount'],
                    'amount_paid' => 0.00,
                    'amount_change' => 0.00,
                    'cashier_id' => $cashier_id,
                    'cashier_name' => $cashier_name,
                    'sales_status_id' => 1,
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id
                ]);

                $sale_id = $sale->id;
                $sale_code = $sale->code;

                Returns::where('id', $return_id)->update(
                    [
                        'sales_of_return_id' => $sale_id,
                        'sales_of_return_code' => $sale_code
                    ]
                );

                foreach ($validatedData['changedProducts'] as $product) {
                    if($product['discount']>0){
                        $discountPercentage = ($product['discount'] / $product['price']) * 100;
    
                        $discountPercentage = round($discountPercentage);
                    }else{
                        $discountPercentage = 0.00;
                    }
    
                    SalesProduct::create([
                        'sale_id' => $sale_id,
                        'sale_code' => $sale_code,
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
                        ->where('cost', $product['cost'])
                        ->first();
    
                    if ($productPrice) {
                        $newQuantity = max(0, $productPrice->qty - $product['quantity']);
    
                        $productPrice->update(['qty' => $newQuantity]);
                    }
    
                    $totalStock = ProductsPrice::where('product_id', $product['id'])->sum('qty');
                    Product::where('id', $product['id'])->update(['qty' => $totalStock]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Return confirmed successfully'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        $validatedData = $request->validate([
            'return_id' => 'required|numeric|min:0|exists:returns,id',
        ]);
        try{
            DB::beginTransaction();

            $return_id = $validatedData['return_id'];

            $return = Returns::find($return_id);
            $sales_of_return_id = $return->sales_of_return_id;

            if($sales_of_return_id){

                $sales_product = SalesProduct::where('sale_id',$sales_of_return_id)->get();
                if($sales_product->count()>0){
                    foreach($sales_product as $product){
                        $product_id = $product->product_id;
                        $product_price = $product->price;
                        $product_quantity = $product->qty;
                        
                        $productPrice = ProductsPrice::where('product_id', $product_id)
                            ->where('price', $product_price)
                            ->first();

                        if ($productPrice) {    
                            $newQuantity = max(0, $productPrice->qty + $product_quantity);

                            $productPrice->update(['qty' => $newQuantity]);
                        }
                        
                        $totalStock = ProductsPrice::where('product_id', $product_id)->sum('qty');
                        
                        Product::where('id', $product_id)->update(['qty' => $totalStock]);
                    }
                    SalesProduct::where('sale_id',$sales_of_return_id)->delete();
                }
                Sale::where('id',$sales_of_return_id)->delete();                
                SalesPayment::where('sale_id',$sales_of_return_id)->delete();
            }

            ReturnsSalesProduct::where('return_id',$return_id)->delete();

            Returns::where('id',$return_id)->delete();

            DB::commit();
            return response()->json(['message' => 'The return has been deleted.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
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

    private function getReturnCode()
    {
        $today = now()->format('ymd');

        $lastSaleToday = Returns::where('code', 'LIKE', "RTN-$today-%")->orderByDesc('code')->first();

        if ($lastSaleToday && preg_match('/RTN-\d{6}-(\d+)/', $lastSaleToday->code, $matches)) {
            $newSaleNumber = intval($matches[1]) + 1;
        } else {
            $newSaleNumber = 1;
        }

        $saleCode = "RTN-$today-" . str_pad($newSaleNumber, 5, '0', STR_PAD_LEFT);

        return $saleCode;
    }

}
