<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExpensesController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('category','subCategory');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                ->orWhere('expense_name', 'LIKE', "%{$search}%")
                ->orWhere('amount', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->whereBetween(DB::raw('DATE(date_time_of_expense)'), [$startDate, $endDate]);
            }
        }

        if ($request->has('sort_column') && $request->has('sort_order')) {
            $sortColumn = $request->sort_column;
            $sortOrder = $request->sort_order;
    
            if (in_array($sortColumn, ['category_id', 'sub_category_id', 'code', 'date_time_of_expense', 'expense_name', 'amount', 'remarks', 'tin', 'or'])) {
                $query->orderBy($sortColumn, $sortOrder);
            }
        }
        
        if ($request->has('numericSelectedCategory')) {
            $numericSelectedCategory = $request->numericSelectedCategory;
            $query->whereIn('category_id', $numericSelectedCategory);
        }

        if ($request->has('numericSelectedSubCategory')) {
            $numericSelectedSubCategory = $request->numericSelectedSubCategory;
            $query->whereIn('sub_category_id', $numericSelectedSubCategory);
        }

        $sales = $query->orderByDesc('date_time_of_expense')->paginate(10);

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

    public function names()
    {
        return Expense::distinct()->pluck('expense_name');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'categoryId' => 'required|numeric|min:1|exists:expense_categories,id',
            'subCategoryId' => 'nullable|numeric|min:1|exists:expense_sub_categories,id',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'dateTime' => 'required|date',
            'remarks' => 'nullable|string|max:255',
            'tin' => 'nullable|string|max:100',
            'or' => 'nullable|string|max:100',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            $expenseCode = $this->getCode();

            Expense::create([
                'category_id' => $validatedData['categoryId'],
                'sub_category_id' => $validatedData['subCategoryId'],
                'code' => $expenseCode,
                'expense_name' => $validatedData['name'],
                'amount' => $validatedData['amount'],
                'tin' => $validatedData['tin'],
                'or' => $validatedData['or'],
                'date_time_of_expense' => $validatedData['dateTime'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! New expense saved..'], 200);

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
            'expenseId' => 'required|numeric|min:0|exists:expenses,id',
        ]);
        try{
            DB::beginTransaction();

            Expense::where('id',$validatedData['expenseId'])->delete();

            DB::commit();
            return response()->json(['message' => 'The expense has been deleted.'], 200);
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

        $lastToday = Expense::where('code', 'LIKE', "EXP-$today-%")->orderByDesc('code')->first();

        if ($lastToday && preg_match('/EXP-\d{6}-(\d+)/', $lastToday->code, $matches)) {
            $newNumber = intval($matches[1]) + 1;
        } else {
            $newNumber = 1;
        }

        $code = "EXP-$today-" . str_pad($newNumber, 5, '0', STR_PAD_LEFT);

        return $code;
    }
}