<?php 

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeDeductionPeriod;
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

class EmployeeDeductionPeriodController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'period' => 'nullable|string'
        ]);

        $query = EmployeeDeductionPeriod::with('employee');
        
        if ($request->has('year') && !empty($request->year)) {
            $year = $request->year;
            $query->where('year', $year);
        }

        if ($request->has('month') && !empty($request->month)) {
            $month = $request->month;
            $query->where('month', $month);
        }

        if ($request->has('period') && !empty($request->period)) {
            $period = $request->period;
            $query->where('period', $period);
        }

        if ($request->has('id') && !empty($request->id)) {
            $id = $request->id;
            $query->where('employee_id', $id);
        }

        $deductions = $query->orderBy('deduction_id','ASC')
            ->get();

        if (!$validated['period']) {
            $deductions = [];
        }

        return response()->json([
            'data' => $deductions
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'deduction_id' => 'required|exists:deductions,id',
            'year' => ['required', 'numeric', 'min:2025', 'max:' . date('Y')],
            'month' => ['required', 'numeric', 'min:1', 'max:12', 'regex:/^(0[1-9]|1[0-2])$/'],
            'period' => 'required|string',
            'isDeductionIncluded' => 'required|boolean'
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $deduction_id = $validated['deduction_id'];
            $year = $validated['year'];
            $month = $validated['month'];
            $period = $validated['period'];

            Employee::findorFail($id);

            if (!$validated['isDeductionIncluded']) {
                $check = EmployeeDeductionPeriod::where('employee_id',$id)
                    ->where('deduction_id', $deduction_id)
                    ->where('year',$year)
                    ->where('month',$month)
                    ->where('period',$period)
                    ->first();
                
                if(!$check){
                    $insert = new EmployeeDeductionPeriod;
                    $insert->employee_id = $id;
                    $insert->deduction_id = $deduction_id;
                    $insert->year = $year;
                    $insert->month = $month;
                    $insert->period = $period;
                    $insert->amount = 0;
                    $insert->save();
                }                
            }else{
                EmployeeDeductionPeriod::where('employee_id', $id)
                    ->where('deduction_id', $deduction_id)
                    ->where('year', $year)
                    ->where('month', $month)
                    ->where('period', $period)
                    ->delete();
            }

            $query = Deduction::with('payrolls','employees');
        
            // if ($request->has('search') && !empty($request->search)) {
            //     $search = $request->search;
            //     $query->where(function ($query) use ($search) {
            //         $query->where('name', 'LIKE', "%{$search}%");
            //         $query->orWhere('group', 'LIKE', "%{$search}%");
            //         $query->orWhere('type', 'LIKE', "%{$search}%");
            //         $query->orWhere('amount', 'LIKE', "%{$search}%");
            //     });
            // }

            $deductions = $query->orderBy('group','ASC')->orderBy('name','ASC')->get();

            DB::commit();
            return response()->json([
                'data' => $deductions,
                'message' => 'Success in updating.'
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
