<?php 

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeOtherEarning;
use App\Models\EmployeeSchedule;
use App\Models\EmployeeServiceRate;
use App\Models\Payroll;
use App\Models\PayrollEmployee;
use App\Models\PayrollOtherEarned;
use App\Models\SchedulePayType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PayrollOtherEarningsController extends Controller
{
    public function index(Request $request)
    {
        
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'payroll_employee_id' => 'required|exists:payroll_employees,id',
                'payroll_id' => 'required|exists:payrolls,id',
                'employee_id' => 'required|exists:employees,id',
                'earning_type_id' => 'required|exists:earning_types,id',
                'type' => 'required|string',
                'amount' => 'required|numeric|min:1',
                'total' => 'required|numeric|min:1',
            ]);
            
            PayrollOtherEarned::create($validated);

            $payroll_id = $validated['payroll_id'];
            $payroll_employee_id = $validated['payroll_employee_id'];

            $payroll = $this->updatePayroll($payroll_id, $payroll_employee_id);
            $employee = $this->fetchEmployee($payroll_employee_id);
            
            return response()->json([
                'message' => 'Payroll other earnings created',
                'payroll' => $payroll,
                'data' => $employee
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'id' => 'required|exists:payroll_other_earneds,id',
                'payroll_employee_id' => 'required|exists:payroll_employees,id',
                'payroll_id' => 'required|exists:payrolls,id',
                'employee_id' => 'required|exists:employees,id',
                'earning_type_id' => 'required|exists:earning_types,id',
                'type' => 'required|string',
                'amount' => 'required|numeric|min:1',
                'total' => 'required|numeric|min:1',
            ]);

            $query = PayrollOtherEarned::findOrFail($id);

            $query->update($validated);

            $payroll_id = $validated['payroll_id'];
            $payroll_employee_id = $validated['payroll_employee_id'];

            $payroll = $this->updatePayroll($payroll_id, $payroll_employee_id);
            $employee = $this->fetchEmployee($payroll_employee_id);

            return response()->json([
                'message' => 'Payroll other earnings updated',
                'payroll' => $payroll,
                'data' => $employee
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $payrollEarned = PayrollOtherEarned::find($id);        
        $payroll_id = $payrollEarned->payroll_id;
        $payroll_employee_id = $payrollEarned->payroll_employee_id;

        PayrollOtherEarned::destroy($id);

        $payroll = $this->updatePayroll($payroll_id, $payroll_employee_id);
        $employee = $this->fetchEmployee($payroll_employee_id);

        return response()->json([
                'message' => 'Payroll other earnings deleted',
                'payroll' => $payroll,
                'data' => $employee
            ], 201);
    }

    private function updatePayroll($payroll_id, $payroll_employee_id)
    {
        $otherEarnedSum = PayrollOtherEarned::where('payroll_employee_id', $payroll_employee_id)
            ->sum('total');

        $employee = PayrollEmployee::find($payroll_employee_id);
        $oldOtherEarned = $employee->other_earned;

        $update = $employee;
        $update->earned = $employee->earned - $oldOtherEarned + $otherEarnedSum;
        $update->other_earned = $employee->other_earned - $oldOtherEarned + $otherEarnedSum;
        $update->gross = $employee->gross - $oldOtherEarned + $otherEarnedSum;
        $update->netpay = $employee->netpay - $oldOtherEarned + $otherEarnedSum;
        $update->save();

        $payrollEmployee = PayrollEmployee::where('payroll_id', $payroll_id)
            ->selectRaw('SUM(earned) as earned_sum, 
                SUM(lates) as lates_sum,
                SUM(gross) as gross_sum,
                SUM(deduction) as deduction_sum,
                SUM(netpay) as netpay_sum
            ')
            ->first();

        $payroll = Payroll::find($payroll_id);
        $payroll->earned = $payrollEmployee->earned_sum;
        $payroll->lwop = $payrollEmployee->lates_sum;
        $payroll->gross = $payrollEmployee->gross_sum;
        $payroll->deduction = $payrollEmployee->deduction_sum;
        $payroll->netpay = $payrollEmployee->netpay_sum;
        $payroll->save();

        return Payroll::with('payrollType', 
                    'employees.deductionList.deduction',
                    'employees.otherEarned.earningType',
                    'employees.employee')
                ->withCount('employees')
                ->where('id',$payroll_id)
                ->first();
    }

    private function fetchEmployee($payroll_employee_id)
    {
        return PayrollEmployee::with('deductionList.deduction',
                'otherEarned.earningType',
                'employee')
            ->where('id', $payroll_employee_id)
            ->first();
    }

}
