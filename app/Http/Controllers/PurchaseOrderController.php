<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderProduct;
use App\Models\PurchaseOrderStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with('supplierInfo','statusInfo','products.productInfo','products.statusInfo');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                    ->orWhereHas('supplierInfo', function ($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($request->has('filter')) {
            $filter = $request->filter;
            if($filter!='All'){
                $query->where('status_id', $filter);
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

        $po = $query->paginate(5);

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
            $po->remarks = $validatedData['remarks'];
            $po->updated_by = $cashier_id;
            $po->save();

            $purchase_order_id = $po->id;

            $this->productsManage($cashier_id, $purchase_order_id, 1, $validatedData['products']);

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

            $this->productsManage($cashier_id, $purchase_order_id,  $validatedData['statusId'], $validatedData['products']);

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
            $query = PurchaseOrderStatus::select('id', 'name')->orderBy('id','ASC')->get();

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

    private function productsManage($cashier_id, $purchase_order_id, $status_id, $products)
    {
        foreach($products as $product){
            if($product['poProductId']){
                $query = PurchaseOrderProduct::findOrFail($product['poProductId']);
            }else{
                $query = new PurchaseOrderProduct;
                $query->purchase_order_id = $purchase_order_id;
                $query->created_by = $cashier_id;
            }
            
            $query->product_id = $product['productId'];
            $query->cost = $product['productCost'];
            $query->qty = $product['productQty'];
            $query->total = $product['productTotal'];

            if(isset($product['productCostReceived'])){
                $query->cost_received = $product['productCostReceived'];
            }
            if(isset($product['productQtyReceived'])){
                $query->qty_received = $product['productQtyReceived'];
            }
            if(isset($product['productTotalReceived'])){
                $query->total_received = $product['productTotalReceived'];
            }
            if(isset($product['productStatusId'])){
                if($status_id!=$product['productStatusId'] && ($status_id>1 && $product['productStatusId']>1)){
                    $status_id = $product['productStatusId'];
                }
            }

            $query->status_id = $status_id;
            $query->updated_by = $cashier_id;
            $query->save();
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