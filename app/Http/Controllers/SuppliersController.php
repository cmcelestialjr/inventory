<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SuppliersController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('contact_person', 'LIKE', "%{$search}%")
                ->orWhere('contact_no', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('filter')){
            $filter = $request->filter;
            if($filter!="all"){
                $query->where('supplier_status', $filter);
            }
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

    public function manage(Request $request)
    {
        if($request->supplierId==null){
            return $this->store($request);
        }else{
            return $this->edit($request);
        }
    }

    private function store($request)
    {
        $validatedData = $request->validate([
            'supplierName' => 'required|string|max:255',
            'contactPerson' => 'required|string|max:255',
            'contactNo' => 'required|string|max:13',
            'email' => 'nullable|email|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $check = Supplier::where('name',$validatedData['supplierName'])->first();

        if($check){
            return response()->json(['message' => 'Error! Supplier already exists..'], 409);
        }

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            Supplier::create([
                'name' => $validatedData['supplierName'],
                'contact_person' => $validatedData['contactPerson'],
                'contact_no' => $validatedData['contactNo'],
                'email_address' => $validatedData['email'],
                'supplier_status' => $validatedData['status'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! New supplier saved..'], 200);

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
            'supplierId' => 'required|integer|exists:suppliers,id',
            'supplierName' => 'required|string|max:255',
            'contactPerson' => 'required|string|max:255',
            'contactNo' => 'required|string|max:13',
            'email' => 'nullable|email|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $check = Supplier::where('name',$validatedData['supplierName'])
            ->where('id','<>',$validatedData['supplierId'])
            ->first();

        if($check){
            return response()->json(['message' => 'Error! Supplier already exists..'], 409);
        }

        $supplier = Supplier::findOrFail($validatedData['supplierId']);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            $supplier->update([
                'name' => $validatedData['supplierName'],
                'contact_person' => $validatedData['contactPerson'],
                'contact_no' => $validatedData['contactNo'],
                'email_address' => $validatedData['email'],
                'supplier_status' => $validatedData['status'],
                'updated_by' => $cashier_id,
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! New supplier saved..'], 200);

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