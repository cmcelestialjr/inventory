<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServicesProduct;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServicesController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('products.product');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('price', 'LIKE', "%{$search}%")
                ->orWhere('estimate_duration', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('filter')){
            $filter = $request->filter;
            $query->where('service_status', $filter);
        }

        $supplier = $query->paginate(10);

        return response()->json([
            'data' => $supplier->items(),
            'meta' => [
                'current_page' => $supplier->currentPage(),
                'last_page' => $supplier->lastPage(),
                'prev' => $supplier->previousPageUrl(),
                'next' => $supplier->nextPageUrl(),
            ]
        ]);
    }
    public function statusTotal(Request $request)
    {
        $totals = DB::table('services')
                ->select('service_status', DB::raw('count(*) as total'));

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $totals->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('price', 'LIKE', "%{$search}%")
                ->orWhere('estimate_duration', 'LIKE', "%{$search}%");
            });
        }

        $totals = $totals->groupBy('service_status')
                ->get();

        $totalAvailable = $totals->firstWhere('service_status', 'Available')->total ?? 0;
        $totalUnavailable = $totals->firstWhere('service_status', 'Unavailable')->total ?? 0;

        return response()->json([
            'totalAvailableResponse' => $totalAvailable,
            'totalUnavailableResponse' => $totalUnavailable,
        ]);
    }
    public function fetch(Request $request)
    {
        $query = Service::with('products.product');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%");
        }

        $services = $query->limit(10)->get();

        return response()->json($services);
    }
    public function removeProduct(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:services_products,id',
        ]);

        $deleted = ServicesProduct::where('id', $validatedData['id'])->delete();

        if ($deleted) {
            return response()->json(['message' => 'Product deleted successfully.'], 200);
        } else {
            return response()->json(['message' => 'Product not found.'], 404);
        }
    }
    public function manage(Request $request)
    {
        return $request->serviceId==null ? $this->store($request) : $this->edit($request);
    }
    private function store($request)
    {
        $validatedData = $request->validate([
            'serviceName' => 'required|string|max:255',
            'servicePrice' => 'required|numeric|min:0',
            'laborCost' => 'required|numeric|min:0',
            'discount' => 'required|numeric|min:0',
            'status' => 'required|in:Available,Unavailable',
            'estimateDuration' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:255',
            'productsSelected' => 'required|array|min:1',
            'productsSelected.*.id' => 'required|integer|exists:products,id',
            'productsSelected.*.qty' => 'required|numeric|min:0',
        ]);

        $check = Service::where('name',$validatedData['serviceName'])->first();

        if($check){
            return response()->json(['message' => 'Error! Service already exists..'], 409);
        }

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            $service = Service::create([
                'name' => $validatedData['serviceName'],
                'price' => $validatedData['servicePrice'],
                'labor_cost' => $validatedData['laborCost'],
                'discount' => $validatedData['discount'],
                'estimate_duration' => $validatedData['estimateDuration'],
                'remarks' => $validatedData['remarks'],
                'service_status' => $validatedData['status'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            $service_id = $service->id;

            $this->manageServiceProducts($validatedData, $service_id, $cashier_id);

            DB::commit();
            return response()->json(['message' => 'Successful! New service saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function edit($request)
    {
        $validatedData = $request->validate([
            'serviceId' => 'required|integer|exists:services,id',
            'serviceName' => 'required|string|max:255',
            'servicePrice' => 'required|numeric|min:0',
            'laborCost' => 'required|numeric|min:0',
            'discount' => 'required|numeric|min:0',
            'status' => 'required|in:Available,Unavailable',
            'estimateDuration' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:255',
            'productsSelected' => 'required|array|min:1',
            'productsSelected.*.id' => 'required|integer|exists:products,id',
            'productsSelected.*.qty' => 'required|numeric|min:0',
        ]);

        $check = Service::where('name',$validatedData['serviceName'])
            ->where('id','<>',$validatedData['serviceId'])
            ->first();

        if($check){
            return response()->json(['message' => 'Error! Service already exists..'], 409);
        }

        $service = Service::findOrFail($validatedData['serviceId']);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            $service->update([
                'name' => $validatedData['serviceName'],
                'price' => $validatedData['servicePrice'],
                'labor_cost' => $validatedData['laborCost'],
                'discount' => $validatedData['discount'],
                'estimate_duration' => $validatedData['estimateDuration'],
                'remarks' => $validatedData['remarks'],
                'service_status' => $validatedData['status'],
                'updated_by' => $cashier_id
            ]);

            $service_id = $service->id;

            $this->manageServiceProducts($validatedData, $service_id, $cashier_id);

            DB::commit();
            return response()->json(['message' => 'Successful! Updated service saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function manageServiceProducts($validatedData, $service_id, $cashier_id)
    {
        foreach ($validatedData['productsSelected'] as $product) {
            ServicesProduct::updateOrCreate(
                [
                    'service_id' => $service_id,
                    'product_id' => $product['id'],
                ],
                [
                    'qty' => $product['qty'],
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id,
                ]
            );
        }
    }
}