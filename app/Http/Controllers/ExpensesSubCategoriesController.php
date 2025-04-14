<?php

namespace App\Http\Controllers;

use App\Models\ExpenseSubCategory;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExpensesSubCategoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = ExpenseSubCategory::with('category','expenseList.category','expenseList.subCategory');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('remarks', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('sort_column') && $request->has('sort_order')) {
            $sortColumn = $request->sort_column;
            $sortOrder = $request->sort_order;
    
            if (in_array($sortColumn, ['category_id', 'name', 'remarks'])) {
                $query->orderBy($sortColumn, $sortOrder);
            }
        }

        $categories = $query->orderByDesc('name')->paginate(10);

        return response()->json([
            'data' => $categories->items(),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'prev' => $categories->previousPageUrl(),
                'next' => $categories->nextPageUrl(),
            ]
        ]);
    }

    public function fetch(Request $request)
    {
        $query = ExpenseSubCategory::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%");
            });
        }

        $categories = $query->orderBy('name')->limit(10)->get();

        return response()->json($categories);
    }
    

    public function manage(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'nullable|numeric|min:1|exists:expense_sub_categories,id',
            'category_id' => 'required|numeric|min:1|exists:expense_categories,id',
            'name' => 'required|string|max:255',
            'remarks' => 'nullable|string|max:255',
        ]);

        return $validatedData['id'] ? $this->update($validatedData) : $this->store($validatedData);
    }
    public function fetchByCategory(Request $request)
    {
        $validatedData = $request->validate([
            'selectedCategory' => 'nullable|array',
            'selectedCategory.*' => 'numeric|exists:expense_categories,id|min:1',
        ]);
        
        if (empty($validatedData['selectedCategory'])) {
            return response()->json([]);
        }

        $query = ExpenseSubCategory::query();
        
        $query->whereIn('category_id', $validatedData['selectedCategory']);
        

        $categories = $query->orderBy('category_id')->orderBy('name')->get();

        return response()->json($categories);
    }
    public function store($validatedData)
    {
        DB::beginTransaction();
        try{
            $user = Auth::user();
            $cashier_id = $user->id;

            ExpenseSubCategory::create([
                'category_id' => $validatedData['category_id'],
                'name' => $validatedData['name'],
                'remarks' => $validatedData['remarks'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! New category saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function update($validatedData)
    {
        DB::beginTransaction();
        try{
            $user = Auth::user();
            $cashier_id = $user->id;

            $update = ExpenseSubCategory::findOrFail($validatedData['id']);
            $update->category_id = $validatedData['category_id'];
            $update->name = $validatedData['name'];
            $update->remarks = $validatedData['remarks'];
            $update->updated_by = $cashier_id;
            $update->save();

            DB::commit();
            return response()->json(['message' => 'Successful! Update category saved..'], 200);

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