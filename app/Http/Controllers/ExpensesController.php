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
        $query = Expense::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                ->orWhere('name', 'LIKE', "%{$search}%")
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
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'dateTime' => 'required|date',
            'remarks' => 'nullable|string|max:255',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            $expenseCode = $this->getCode();

            Expense::create([
                'code' => $expenseCode,
                'expense_name' => $validatedData['name'],
                'amount' => $validatedData['amount'],
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