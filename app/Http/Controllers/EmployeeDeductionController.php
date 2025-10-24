<?php 

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\Payroll;
use App\Models\PayrollDeduction;
use App\Models\PayrollEmployee;
use App\Models\PayrollMonth;
use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeDeductionController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('deductions.deduction');
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->where('employee_no', 'LIKE', "%{$search}%");
                $query->orWhere('lastname', 'LIKE', "%{$search}%");
                $query->orWhere('firstname', 'LIKE', "%{$search}%");
            });
        }

        $employees = $query->orderBy('lastname','ASC')
            ->orderBy('firstname','ASC')
            ->limit(30)
            ->get();

        return response()->json([
            'data' => $employees
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'deduction_id' => 'required|exists:deductions,id',
            'amount' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $deduction_id = $validated['deduction_id'];
            $amount = $validated['amount'];

            Employee::findorFail($id);

            $check = EmployeeDeduction::where('employee_id',$id)
                ->where('deduction_id',$deduction_id)
                ->first();

            if($check){
                $update = EmployeeDeduction::find($check->id);
            }else{
                $update = new EmployeeDeduction;
                $update->employee_id = $id;
                $update->deduction_id = $deduction_id;
            }
            $update->amount = $amount;
            $update->save();

            DB::commit();
            return response()->json([
                'message' => 'Success in updating deduction.'
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

    public function show(Request $request, $id)
    {
        $validated = $request->validate([
            'deduction_id' => 'required|exists:deductions,id',
            'year' => 'required|regex:/^\d{4}$/|integer|min:2024|max:' . date('Y'),
        ]);

        $year = $validated['year'];
        $deduction_id = $validated['deduction_id'];

        Employee::findorFail($id);

        $deductions = PayrollMonth::join('payroll_deductions', 
                    'payroll_months.payroll_employee_id', '=', 'payroll_deductions.payroll_employee_id')
            ->where('payroll_months.year', $year)
            ->where('payroll_months.employee_id', $id)
            ->where('payroll_deductions.deduction_id', $deduction_id)
            ->where('payroll_deductions.employee_id', $id)
            ->selectRaw('payroll_months.month, SUM(payroll_deductions.amount) as total_amount')
            ->groupBy('payroll_months.month')
            ->orderBy('payroll_months.month')
            ->get();

        $total = $deductions->sum('total_amount');

        return response()->json([
            'data' => $deductions,
            'total' => $total,
        ]);
    }
}
