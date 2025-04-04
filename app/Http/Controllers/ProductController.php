<?php

namespace App\Http\Controllers;

use App\Imports\ProductImport;
use App\Models\Product;
use App\Models\ProductsCategory;
use App\Models\ProductsPrice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('pricingList')
            ->where('id','>',0);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('filter')) {
            $filter = $request->filter;
            switch ($filter) {
                case 'available':
                    $query->where('qty', '>', 0);
                    $query->where('product_status', 'Available');
                    break;
            
                case 'out-of-stock':
                    $query->where('qty', '=', 0);
                    $query->where('product_status', 'Available');
                    break;
            
                case 'low-stock':
                    $query->whereBetween('qty', [1, 4]);
                    $query->where('product_status', 'Available');
                    break;

                case 'phaseout':
                    $query->where('product_status', 'Phaseout');
                    break;
            }
        }

        $products = $query->paginate(10);

        $products->getCollection()->transform(function ($product) {
            $product->img = $product->img ? asset("storage/$product->img") : asset('images/no-image-icon.png');
            return $product;
        });

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'prev' => $products->previousPageUrl(),
                'next' => $products->nextPageUrl(),
            ]
        ]);
    }

    public function summary()
    {
        $summary = Product::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN qty > 0 AND product_status = 'Available' THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN qty = 0 AND product_status = 'Available' THEN 1 ELSE 0 END) as out_of_stock,
            SUM(CASE WHEN qty BETWEEN 1 AND 4 AND product_status = 'Available' THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN product_status = 'Phaseout' THEN 1 ELSE 0 END) as phaseout
        ")->first();


        return response()->json([
            'total' => $summary->total,
            'available' => $summary->available,
            'out_of_stock' => $summary->out_of_stock,
            'low_stock' => $summary->low_stock,
            'phaseout' => $summary->phaseout,
        ]);
    }

    public function categories()
    {
        $categories = ProductsCategory::get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:products',
            'name' => 'required|string',
            'variant' => 'required|string',
            'cost' => 'required|numeric',
            'productCategoryId' => 'required|integer|exists:products_categories,id',
            'price' => 'required|numeric',
            'qty' => 'required|numeric',
            'effective_date' => 'required|date',
        ]);

        $name_variant = "$request->name-$request->variant";

        $checkProductCodeAndName = Product::where('code',$request->code)
            ->orWhere('name_variant',$name_variant)
            ->select('id')
            ->first();

        if($checkProductCodeAndName){
            return response()->json(['message' => 'Code or Name Variant already exists!'], 201);
        }

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;

        $insert = new Product;
        $insert->code = $request->code;
        $insert->name = $request->name;
        $insert->variant = $request->variant;
        $insert->name_variant = $name_variant;
        $insert->cost = $request->cost;
        $insert->price = $request->price;
        $insert->qty = $request->qty;
        $insert->restock_date = date('Y-m-d');
        $insert->product_status = 'Available';        
        $insert->product_category_id = $request->productCategoryId;        
        $insert->updated_by = $user_id;
        $insert->created_by = $user_id;
        $insert->save();
        $product_id = $insert->id;

        $this->productPrice($user_id,$product_id,$request);
        

        return response()->json(['message' => 'success'], 201);

    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;

        $product = Product::where('id', $id)->first();

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $request->validate([
            'code' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'variant' => 'required|string|max:255',
            'productCategoryId' => 'required|integer|exists:products_categories,id',
        ]);

        $name_variant = "$request->name-$request->variant";

        $checkProductCodeAndName = Product::where('id','<>',$id)
            ->where(function ($query) use ($request, $name_variant) {
                $query->where('code', $request->code)
                ->orWhere('name_variant', $name_variant);
            })        
            ->select('id')
            ->first();

        if($checkProductCodeAndName){
            return response()->json(['message' => 'Code or Name Variant already exists!'], 201);
        }

        $product->update([
            'code' => $request->code,
            'name' => $request->name,
            'variant' => $request->variant,
            'name_variant' => $name_variant,
            'product_category_id' => $request->productCategoryId,
        ]);

        // $this->productPrice($user_id,$id,$request);

        return response()->json(['message' => 'Product updated successfully', 'product' => $product]);
    }

    public function storePricing(Request $request)
    {
        $request->validate([
            'cost' => 'required|numeric',
            'price' => 'required|numeric',
            'qty' => 'required|numeric',
            'effective_date' => 'required|date',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $checkProductPrice = ProductsPrice::where('product_id',$request->product_id)
            ->where('price',$request->price)
            ->where('cost',$request->cost)
            ->first();
        if ($checkProductPrice) {
            return response()->json([
                'message' => 'Price and Cost already exists.']);
        }

        $user_id = $user->id;

        $this->productPrice($user_id,$request->product_id,$request);
        $this->updateLatestPrice($request->product_id);

        return response()->json(['message' => 'success']);
    }

    public function updatePricing(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;

        $productPrice = ProductsPrice::where('id', $id)->first();

        if (!$productPrice) {
            return response()->json(['message' => 'Product Pricing not found'], 404);
        }

        $request->validate([
            'cost' => 'required|numeric',
            'price' => 'required|numeric',
            'qty' => 'required|numeric',
            'effective_date' => 'required|date',
        ]);

        $productPrice->update([
            'cost' => $request->cost,
            'price' => $request->price,
            'qty' => $request->qty,
            'effective_date' => Carbon::parse($request->effective_date)->format('Y/m/d'),
            'updated_by' => $user_id
        ]);

        $this->updateLatestPrice($productPrice->product_id);

        return response()->json(['message' => 'success']);
    }

    public function fetch(Request $request)
    {
        $query = Product::with('pricingListAvailable');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%");
            $query->orWhere('code', 'LIKE', "%{$search}%");
        }

        $products = $query->limit(10)->get();

        $products->transform(function ($product) {
            $product->img = $product->img ? asset("storage/$product->img") : asset('images/no-image-icon.png');
            return $product;
        });

        return response()->json($products);
    }

    private function productPrice($user_id,$product_id,$request)
    {
        $checkProductPrice = ProductsPrice::where('product_id',$product_id)
            ->where('price',$request->price)
            ->where('cost',$request->cost)
            ->first();

        if($checkProductPrice){                                                                                                                  
            $insert = ProductsPrice::find($checkProductPrice->id);
        }else{
            $insert = new ProductsPrice;
            $insert->product_id = $product_id;
        }
        $insert->cost = $request->cost;
        $insert->price = $request->price;
        $insert->qty = $request->qty;
        $insert->effective_date = Carbon::parse($request->effective_date)->format('Y/m/d');
        $insert->updated_by = $user_id;
        $insert->created_by = $user_id;
        $insert->save();
    }
    private function updateLatestPrice($product_id)
    {
        $productPrice = ProductsPrice::where('product_id',$product_id)
            ->orderBy('effective_date','DESC')
            ->orderBy('id','DESC')
            ->first();
        if($productPrice){
            $qty = ProductsPrice::where('product_id',$product_id)->sum('qty');
            $update = Product::find($product_id);
            $update->cost = $productPrice->cost;
            $update->price = $productPrice->price;
            $update->qty = $qty;
            $update->save();
        }
    }
    public function categoryCode(Request $request)
    {
        $request->validate([
            'id' => 'required|numeric|exists:products_categories,id',
        ]);

        $productCategory = ProductsCategory::where('id', $request->id)->first();

        if (!$productCategory) {
            return response()->json(['message' => 'Product Category not found'], 404);
        }

        if($productCategory->increment=="Y"){
            $getCode = Product::where('product_category_id',$productCategory->id)->orderBy('code','DESC')->first();
            $code = $getCode ? $getCode->code + 1 : $productCategory->code_start;
        }else{
            $code = "";
        }

        return response()->json([
            'message' => 'success',
            'increment' => $productCategory->increment,
            'code' => $code
        ], 200);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        $file = $request->file('file');

        $filePath = $file->storeAs('temp/', $file->getClientOriginalName());        
        $filePath = storage_path( 'app/private/temp/'.$file->getClientOriginalName());

        Excel::import(new ProductImport($filePath), $file);
        $count = Product::count(); // Or count records inserted by the import
        return response()->json(['message' => "Products imported successfully! Total records: $count"]);
       
    }
}