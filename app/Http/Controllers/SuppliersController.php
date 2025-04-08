<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierContact;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SuppliersController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::with('contacts');

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

        $supplier = $query->orderBy('name')->paginate(10);

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

    public function fetch(Request $request)
    {
        $query = Supplier::when($request->has('search') && !empty($request->search), function ($query) use ($request) {
                $search = $request->search;
                $query->where('name', 'LIKE', "%{$search}%");
            });
        $suppliers = $query->limit(10)->get();

        return response()->json($suppliers);
    }

    public function removeContact(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|numeric|min:0|exists:supplier_contacts,id',
        ]);
        try{
            SupplierContact::where('id',$validatedData['id'])->delete();
            return response()->json(['message' => 'Contact deleted successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
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
            'contactPerson' => 'nullable|string|max:255',
            'contacts' => 'required|array|min:1',
            'contacts.*' => 'required',
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

            $supplier = Supplier::create([
                'name' => $validatedData['supplierName'],
                'contact_person' => $validatedData['contactPerson'],
                'email_address' => $validatedData['email'],
                'supplier_status' => $validatedData['status'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            $supplierId = $supplier->id;
            $this->contactUpdate($cashier_id,$supplierId, $validatedData['contacts']);

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
            'contactPerson' => 'nullable|string|max:255',
            'contacts' => 'required|array|min:1',
            'contacts.*' => 'required',
            'email' => 'nullable|email|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $supplierId = $validatedData['supplierId'];

        $check = Supplier::where('name',$validatedData['supplierName'])
            ->where('id','<>',$supplierId)
            ->first();

        if($check){
            return response()->json(['message' => 'Error! Supplier already exists..'], 409);
        }

        $supplier = Supplier::findOrFail($supplierId);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            $supplier->update([
                'name' => $validatedData['supplierName'],
                'contact_person' => $validatedData['contactPerson'],
                'email_address' => $validatedData['email'],
                'supplier_status' => $validatedData['status'],
                'updated_by' => $cashier_id,
            ]);

            $this->contactUpdate($cashier_id,$supplierId, $validatedData['contacts']);

            DB::commit();
            return response()->json(['message' => 'Successful! Updated supplier saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function contactUpdate($cashierId, $supplierId, $contacts)
    {
        foreach ($contacts as $contact) {
            $supplierContact = SupplierContact::find($contact['id']);
            if($supplierContact){
                $supplierContact->contact_no = $contact['contact_no'];
                $supplierContact->updated_by = $cashierId;
                $supplierContact->save();
            }else{
                $insert = new SupplierContact;
                $insert->supplier_id = $supplierId;
                $insert->contact_no = $contact['contact_no'];
                $insert->updated_by = $cashierId;
                $insert->created_by = $cashierId;
                $insert->save();
            }
        }
    }
}