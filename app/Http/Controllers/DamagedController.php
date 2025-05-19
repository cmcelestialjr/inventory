<?php

namespace App\Http\Controllers;

use App\Models\Damage;
use App\Models\DamageStatus;
use App\Models\Product;
use App\Models\ProductsPrice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DamagedController extends Controller
{
    public function index(Request $request)
    {
        $query = Damage::with('statusInfo','productInfo.productCategory','productInfo.pricingList');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->whereHas('productInfo', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('code', 'LIKE', "%{$search}%");
                });
                
                $query->orWhereHas('statusInfo', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        if ($request->has('filter')){
            $filter = $request->filter;
            if($filter!="all"){
                $query->where('status_id', $filter);
            }
        }

        $damaded = $query->orderBy('created_by','DESC')->paginate(10);

        $damaded->getCollection()->transform(function ($product) {
            $product->productInfo->img = $product->productInfo->img ? asset("storage/".$product->productInfo->img) : asset('images/no-image-icon.png');
            return $product;
        });

        return response()->json([
            'data' => $damaded->items(),
            'meta' => [
                'current_page' => $damaded->currentPage(),
                'last_page' => $damaded->lastPage(),
                'prev' => $damaded->previousPageUrl(),
                'next' => $damaded->nextPageUrl(),
            ]
        ]);
    }

    public function fetchStatuses()
    {
        $statuses = DamageStatus::where('id','>',1)->get();

        return response()->json($statuses);
    }

    public function manage(Request $request)
    {
        $validatedData = $request->validate([
            'damageId' => 'nullable|integer|exists:damages,id',
            'productId' => 'required|integer|exists:products,id',
            'qty' => 'required|numeric|min:1',
            'price' => 'required|numeric|min:1',
            'cost' => 'required|numeric|min:1',
            'amount' => 'required|numeric|min:1',
            'status' => 'required|integer|exists:damage_statuses,id',
            'remarks' => 'nullable|string|max:255',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_name = $user->name;
            $cashier_id = $user->id;

            $qty = $validatedData['qty'];
            $product_id = $validatedData['productId'];
            $price = $validatedData['price'];

            $damage = Damage::find($validatedData['damageId']);

            if(!$damage){
                $damage = new Damage();
                $damage->product_id = $product_id;
                $qtyOld = 0;
            }else{
                $qtyOld = $damage->qty;
            }

            $damage->status_id = $validatedData['status'];
            $damage->price = $validatedData['price'];
            $damage->cost = $validatedData['cost'];
            $damage->qty = $qty;
            $damage->amount = $validatedData['amount'];
            $damage->remarks = $validatedData['remarks'];
            $damage->updated_by = $cashier_id;
            $damage->created_by = $cashier_id;
            $damage->save();

            if($qty<$qtyOld || $qty>$qtyOld){
                $productPrice = ProductsPrice::where('product_id', $product_id)
                            ->where('price', $price)
                            ->first();
        
                if ($productPrice) {                    
                    if($qty<$qtyOld){
                        $qtyDiff = $qtyOld-$qty;
                        $newQuantity = max(0, $productPrice->qty + $qtyDiff);
                    }else{
                        $qtyDiff = $qty-$qtyOld;
                        $newQuantity = max(0, $productPrice->qty - $qtyDiff);
                    }
                    $productPrice->update(['qty' => $newQuantity]);
                }
        
                $totalStock = ProductsPrice::where('product_id', $product_id)->sum('qty');
                Product::where('id', $product_id)->update(['qty' => $totalStock]);
            }

            DB::commit();
            return response()->json(['message' => 'Damaged confirmed successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}