<?php

namespace App\Http\Controllers;

use App\Models\PaymentStatus;
use App\Models\ProductsPrice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderPayment;
use App\Models\PurchaseOrderProduct;
use App\Models\PurchaseOrderStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::join('suppliers', 'suppliers.id', '=', 'purchase_orders.supplier_id')
            ->select('purchase_orders.*', 'suppliers.name as supplier_name', 'suppliers.address as supplier_address');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                    ->orWhereHas('supplierInfo', function ($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($request->has('filterStatus')) {
            $filter = $request->filterStatus;
        
            if ($filter !== 'All') {
                if (Str::startsWith($filter, 'payment_status_id_')) {
                    $paymentStatusId = (int) str_replace('payment_status_id_', '', $filter);
                    $query->where('payment_status_id', $paymentStatusId);
                } else {
                    $query->where('status_id', $filter);
                }
            }
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date_time_ordered', [$startDate, $endDate])
                        ->orWhereBetween('date_time_received', [$startDate, $endDate]);
                });
            }
        }

        if ($request->has('sort_column') && $request->has('sort_order')) {
            $sortColumn = $request->sort_column;
            $sortOrder = $request->sort_order;
    
            if (in_array($sortColumn, ['code', 'supplier_name', 'status_id', 'payment_status_id', 'remarks', 'date_time_ordered', 'date_time_received'])) {
                $query->orderBy($sortColumn, $sortOrder);
            }
        }

        $po = $query->orderBy('date_time_ordered','DESC')->paginate(5);

        $po->load(['statusInfo', 'products.productInfo', 'products.statusInfo', 'paymentStatusInfo', 'payments']);

        return response()->json([
            'data' => $po->items(),
            'meta' => [
                'current_page' => $po->currentPage(),
                'last_page' => $po->lastPage(),
                'prev' => $po->previousPageUrl(),
                'next' => $po->nextPageUrl(),
            ]
        ]);
    }

    public function manage(Request $request)
    {
        $validatedData = $request->validate([
            'poId' => 'nullable|integer|exists:purchase_orders,id',
            'supplierId' => 'required|integer|exists:suppliers,id',
            'dateTime' => 'required',
            'remarks' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.poProductId' => 'nullable|integer|exists:purchase_order_products,id',
            'products.*.productId' => 'required|integer|exists:products,id',
            'products.*.productCost' => 'required|numeric|min:0',
            'products.*.productQty' => 'required|numeric|min:0',
            'products.*.productTotal' => 'required|numeric|min:0',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            $supplier_id = $validatedData['supplierId'];
            
            if($validatedData['poId']){
                $po = PurchaseOrder::findOrFail($validatedData['poId']);                
            }else{
                $po = new PurchaseOrder;
                $po->code = $this->getCode();
                $po->created_by = $cashier_id;
            }

            $po->supplier_id = $validatedData['supplierId'];
            $po->date_time_ordered = date('Y-m-d H:i:s',strtotime($validatedData['dateTime']));
            $po->status_id = 1;
            $po->payment_status_id = 1;
            $po->remarks = $validatedData['remarks'];
            $po->updated_by = $cashier_id;
            $po->save();

            $purchase_order_id = $po->id;

            $this->productsManage($cashier_id, $supplier_id, $purchase_order_id, 1, $validatedData['products']);

            DB::commit();
            return response()->json(['message' => 'Successful! Purchase order saved..',
                'data' => ""
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
    public function manageStatus(Request $request)
    {
        $validatedData = $request->validate([
            'poId' => 'nullable|integer|exists:purchase_orders,id',
            'dateTimeReceived' => 'required',
            'statusId' => 'required|integer|exists:purchase_order_statuses,id',
            'products' => 'required|array|min:1',
            'products.*.poProductId' => 'nullable|integer|exists:purchase_order_products,id',
            'products.*.productId' => 'required|integer|exists:products,id',
            'products.*.productCost' => 'required|numeric|min:0',
            'products.*.productQty' => 'required|numeric|min:0',
            'products.*.productTotal' => 'required|numeric|min:0',
            'products.*.productCostReceived' => 'required|numeric|min:0',
            'products.*.productQtyReceived' => 'required|numeric|min:0',
            'products.*.productTotalReceived' => 'required|numeric|min:0',
            'products.*.productStatusId' => 'required|integer|exists:purchase_order_statuses,id',
        ]);
        // dd($validatedData);
        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            
            $po = PurchaseOrder::findOrFail($validatedData['poId']);

            $po->date_time_received = date('Y-m-d H:i:s',strtotime($validatedData['dateTimeReceived']));
            $po->status_id = $validatedData['statusId'];
            $po->updated_by = $cashier_id;
            $po->save();

            $purchase_order_id = $po->id;
            $supplier_id = $po->supplier_id;

            $this->productsManage($cashier_id, $supplier_id, $purchase_order_id,  $validatedData['statusId'], $validatedData['products']);

            DB::commit();
            return response()->json(['message' => 'Successful! Purchase order saved..',
                'data' => ""
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
    public function removeProduct(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:purchase_order_products,id',
        ]);

        $query = PurchaseOrderProduct::findOrFail($validatedData['id']);
        $count = PurchaseOrderProduct::where('purchase_order_id',$query->purchase_order_id)->count();

        if($query->status_id>1){
            return response()->json(['message' => 'Product cannot be remove..'], 200);
        }

        if($count<=1){
            return response()->json(['message' => 'Product cannot be remove because it is the last product in the order.'], 200);
        }
        
        $deleted = PurchaseOrderProduct::where('id', $validatedData['id'])->delete();

        if ($deleted) {
            return response()->json(['message' => 'Product deleted successfully.'], 200);
        } else {
            return response()->json(['message' => 'Product not found.'], 404);
        }
    }

    public function statuses(Request $request)
    {
        try {
            $query = PurchaseOrderStatus::withCount(['purchaseOrders' => function ($q) use ($request) {
                if ($request->has('start_date') && $request->has('end_date')) {
                    $startDate = $request->start_date;
                    $endDate = $request->end_date;                    
                    $q->whereBetween(DB::raw('DATE(date_time_ordered)'), [$startDate, $endDate]);
                }
            }])->orderBy('id','ASC')->get();

            return response()->json([
                'success' => true,
                'data' => $query
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase order statuses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function payments(Request $request)
    {
        try {
            $query = PaymentStatus::withCount(['puchaseOrdersPayments' => function ($q) use ($request) {
                if ($request->has('start_date') && $request->has('end_date')) {
                    $startDate = $request->start_date;
                    $endDate = $request->end_date;                    
                    $q->whereBetween(DB::raw('DATE(date_time_ordered)'), [$startDate, $endDate]);
                }
            }])->orderBy('id','ASC')->get();

            return response()->json([
                'success' => true,
                'data' => $query
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase order statuses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function payment(Request $request)
    {  
        $validatedData = $request->validate([
            'payment.purchase_order_id' => 'integer|exists:purchase_orders,id',
            'payment.id' => 'nullable|exists:purchase_order_payments,id',
            'payment.payment_option_id' => 'integer|exists:payment_options,id',
            'payment.payment_option_name' => 'string|max:255',
            'payment.amount' => 'numeric|min:0',
            'payment.payment_date' => 'date',
            'payment.remarks' => 'nullable|string',
        ]);

        $purchase_order_id = $validatedData['payment']['purchase_order_id'];
        
        $purchaseOrder = PurchaseOrder::findOrFail($purchase_order_id);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $cashier_id = $user->id;

            if(isset($validatedData['payment']['id'])){
                $payment = PurchaseOrderPayment::findOrFail($validatedData['payment']['id']);
            }else{
                $payment = new PurchaseOrderPayment;
                $payment->purchase_order_id = $purchase_order_id;
                $payment->created_by = $cashier_id;               
            }
            
            $payment->remarks = $validatedData['payment']['remarks'];
            $payment->payment_option_id = $validatedData['payment']['payment_option_id'];
            $payment->payment_option_name = $validatedData['payment']['payment_option_name'];
            $payment->amount = $validatedData['payment']['amount'];
            $payment->payment_date = date('Y-m-d H:i:s',strtotime($validatedData['payment']['payment_date']));
            $payment->updated_by = $cashier_id;
            $payment->save();

            $productsAmount = PurchaseOrderProduct::where('purchase_order_id',$purchase_order_id)->sum('total_received');
            $paymentAmount = PurchaseOrderPayment::where('purchase_order_id',$purchase_order_id)->sum('amount');
            $remainingAmount = $productsAmount-$paymentAmount;

            if($remainingAmount<=$productsAmount && $paymentAmount<=0){
                $payment_status_id = 1;
            }elseif($productsAmount>$paymentAmount){
                $payment_status_id = 2;
            }else{
                $payment_status_id = 3;
            }
            
            $purchaseOrder->payment_status_id = $payment_status_id;
            $purchaseOrder->save();
            
            $purchaseOrder = PurchaseOrder::with(['statusInfo', 'products.productInfo', 'products.statusInfo', 'paymentStatusInfo', 'payments'])
                ->where('id',$purchase_order_id)->first();

            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Successful! payment transaction saved..',
                'data' => $purchaseOrder
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

    private function productsManage($cashier_id, $supplier_id, $purchase_order_id, $status_id, $products)
    {
        foreach($products as $product){
            if($product['poProductId']){
                $query = PurchaseOrderProduct::findOrFail($product['poProductId']);
                $status_id_old = $query->status_id;
                $cost_old = $query->cost_received;
                $qty_old = $query->qty_received;
            }else{
                $query = new PurchaseOrderProduct;
                $query->purchase_order_id = $purchase_order_id;
                $query->created_by = $cashier_id;
                $status_id_old = $status_id;
                $cost_old = 0;
                $qty_old = 0;
            }
            $product_id = $product['productId'];
            $cost = $product['productCost'];
            
            $query->product_id = $product_id;
            $query->cost = $cost;
            $query->qty = $product['productQty'];
            $query->total = $product['productTotal'];

            if(isset($product['productStatusId'])){
                if($status_id!=$product['productStatusId'] && ($status_id>1 && $product['productStatusId']>1)){
                    $status_id = $product['productStatusId'];
                }
            }

            $cost_received = 0;
            $qty_received = 0;
            $total_received = 0;

            if($status_id==2){
                if(isset($product['productCostReceived'])){
                    $cost_received = $product['productCostReceived'];
                }
                if(isset($product['productQtyReceived'])){
                    $qty_received = $product['productQtyReceived'];
                }
                if(isset($product['productTotalReceived'])){
                    $total_received = $product['productTotalReceived'];
                }
            }

            $this->productsUpdate($cashier_id, $supplier_id,$product_id, $status_id, $status_id_old, $cost_received, $cost, $cost_old, $qty_received, $qty_old);

            $query->cost_received = $cost_received;
            $query->qty_received = $qty_received;
            $query->total_received = $total_received;
            $query->status_id = $status_id;
            $query->updated_by = $cashier_id;
            $query->save();
        }
    }

    private function productsUpdate($cashier_id, $supplier_id, $product_id, $status_id, $status_id_old, $cost, $cost_product, $cost_old, $qty, $qty_old)
    {
        
        $cost_check = $cost>0 ? $cost : $cost_product;
        $cost_check = $cost_old>0 && $cost!=$cost_old ? $cost_old : $cost_check;
        
        $query = ProductsPrice::where('product_id', $product_id)
            ->where('cost', $cost_check)
            ->first();
        if($query){
            $update = ProductsPrice::find($query->id);
            $update->supplier_id = $supplier_id;
            $update->qty = $status_id_old==2 && $status_id!=2 ? $query->qty - $qty_old : $query->qty + $qty;
            $update->save();
        }else{
            $productInfo = ProductsPrice::where('product_id', $product_id)
                ->orderBy('qty','DESC')
                ->first();
            $product_price = $productInfo->price;
            $insert = new ProductsPrice;
            $insert->supplier_id = $supplier_id;
            $insert->product_id = $product_id;
            $insert->cost = $cost;
            $insert->price = $product_price;
            $insert->qty = $qty;
            $insert->discount = 0;
            $insert->discount_percentage = 0;
            $insert->effective_date = date('Y-m-d');
            $insert->updated_by = $cashier_id;
            $insert->created_by = $cashier_id;
            $insert->save();
        }
    }

    private function getCode()
    {
        $today = now()->format('ymd');

        $query = PurchaseOrder::where('code', 'LIKE', "PO-$today-%")->orderByDesc('code')->first();

        $number = $query && preg_match('/PO-\d{6}-(\d+)/', $query->code, $matches) ? intval($matches[1]) + 1 : 1;

        $code = "PO-$today-" . str_pad($number, 5, '0', STR_PAD_LEFT);

        return $code;
    }
}