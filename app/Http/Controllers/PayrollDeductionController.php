<?php 

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Employee;
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

class PayrollDeductionController extends Controller
{
    public function index()
    {
        $deductions = Deduction::orderBy('group','ASC')->orderBy('name','ASC')->get();

        return response()->json([
            'data' => $deductions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:payroll_employees,id',
            'deduction_id' => 'required|integer|exists:deductions,id',
            'amount' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $update = PayrollEmployee::findOrFail($validated['id']);            

            $payroll_employee_id = $update->id;
            $deduction_id = $validated['deduction_id'];

            $checkDeduction = PayrollDeduction::where('payroll_employee_id',$deduction_id)->first();

            if($checkDeduction){
                $payroll_id = $update->payroll_id;

                $payroll = $this->updatePayroll($payroll_id);

                DB::commit();
                return response()->json([
                    'message' => 'Success in adding new deduction.',
                    'data' => $payroll
                ], 200);
            }

            $insertDeduction = new PayrollDeduction;
            $insertDeduction->payroll_employee_id = $payroll_employee_id;
            $insertDeduction->payroll_id = $update->payroll_id;
            $insertDeduction->employee_id = $update->employee_id;
            $insertDeduction->deduction_id = $deduction_id;
            $insertDeduction->amount = $validated['amount'];
            $insertDeduction->save();

            $deductionSum = PayrollDeduction::where('payroll_employee_id', $payroll_employee_id)->sum('amount');
            $deduction = $deductionSum + $update->lates_absences;

            $update->deduction = $deduction;
            $update->netpay = $update->earned - $deduction;
            $update->save();

            $payroll_id = $update->payroll_id;

            $payroll = $this->updatePayroll($payroll_id);

            DB::commit();
            return response()->json([
                'message' => 'Success in adding new deduction.',
                'data' => $payroll
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

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'id' => 'required|integer',
            'option' => 'required|string|in:lates,deduction',
            'amount' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $id = $validated['id'];
            $option = $validated['option'];
            $amount = $validated['amount'];

            $update = $option=="lates" ? PayrollEmployee::findOrFail($id) : PayrollDeduction::findorFail($id);
            if($option=="lates"){
                $update->lates_absences = $amount;
            }else{
                $update->amount = $amount;
            }
            $update->save();
            
            $payroll_employee_id = $option=="lates" ? $update->id : $update->payroll_employee_id;

            $deductionSum = PayrollDeduction::where('payroll_employee_id', $payroll_employee_id)->sum('amount');            

            $payrollEmployee = PayrollEmployee::find($payroll_employee_id);
            $deduction = $deductionSum + $payrollEmployee->lates_absences;

            $payrollEmployee->deduction = $deduction;
            $payrollEmployee->netpay = $payrollEmployee->earned - $deduction;
            $payrollEmployee->save();

            $payroll_id = $payrollEmployee->payroll_id;

            $payroll = $this->updatePayroll($payroll_id);

            DB::commit();
            return response()->json([
                'message' => 'Success in adding new deduction.',
                'data' => $payroll
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

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $delete = PayrollDeduction::findOrFail($id);

            $payroll_employee_id = $delete->payroll_employee_id;

            $delete->delete();            

            $deductionSum = PayrollDeduction::where('payroll_employee_id', $payroll_employee_id)->sum('amount');            

            $payrollEmployee = PayrollEmployee::find($payroll_employee_id);
            $deduction = $deductionSum + $payrollEmployee->lates_absences;

            $payrollEmployee->deduction = $deduction;
            $payrollEmployee->netpay = $payrollEmployee->earned - $deduction;
            $payrollEmployee->save();

            $payroll_id = $payrollEmployee->payroll_id;

            $payroll = $this->updatePayroll($payroll_id);

            DB::commit();
            return response()->json([
                'message' => 'Deduction deleted successfully',
                'data' => $payroll
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['message' => 'Payroll not found'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete payroll'], 500);
        }
    }

    public function updateEarned(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:payroll_employees,id',
            'salary' => 'required|numeric',
            'days' => 'required|numeric',
            'earned' => 'required|numeric',
            'netpay' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $update = PayrollEmployee::findOrFail($validated['id']);
            $update->salary = $validated['salary'];
            $update->no_of_day_present = $validated['days'];
            $update->earned = $validated['earned'];
            $update->netpay = $validated['netpay'];
            $update->save();

            $payroll_id = $update->payroll_id;

            $payroll = $this->updatePayroll($payroll_id);

            DB::commit();
            return response()->json([
                'message' => 'Update successfully!',
                'data' => $payroll
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

    private function updatePayroll($payroll_id)
    {
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

        return Payroll::with('payrollType','employees.deductionList.deduction')
                ->withCount('employees')
                ->where('id',$payroll_id)
                ->first();
    }
}
