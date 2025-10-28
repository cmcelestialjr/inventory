<?php 

namespace App\Http\Controllers;

use App\Models\Advance;
use App\Models\AdvanceDeduction;
use App\Models\Deduction;
use App\Models\EmployeeDeduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdvancesController extends Controller
{
    public function index(Request $request)
    {
        $query = Advance::with('employee','status', 'deductions.payroll');
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->where('code', 'LIKE', "%{$search}%");
                $query->orWhere('advance_amount', 'LIKE', "%{$search}%");
                $query->orWhereHas('employee', function ($q) use ($search) {
                    $q->where('lastname', 'LIKE', "%{$search}%");
                    $q->orWhere('firstname', 'LIKE', "%{$search}%");
                });
                $query->orWhereHas('status', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        if ($request->has('year') && !empty($request->year)) {
            $year = $request->year;
            $query->whereYear('created_at', $year);
        }

        if ($request->has('status') && !empty($request->status)) {
            $status = $request->status;
            $query->where('status_id', $status);
        }

        $advances = $query->orderBy('code','desc')->get();
        
        return response()->json([
            'data' => $advances
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'advance_amount' => 'required|numeric|min:1',
            'repayment_periods' => 'required|numeric|min:1',
            'monthly_deduction' => 'required|numeric|min:1',
            'status_id' => 'required|integer|exists:advance_statuses,id',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $employee_id = $validated['employee_id'];
            $repayment_periods = $validated['repayment_periods'];
            $monthly_deduction = $validated['monthly_deduction'];
            $status_id = $validated['status_id'];

            $code = $this->fetchCode();
            
            $insert = new Advance();
            $insert->code = $code;
            $insert->employee_id = $employee_id;
            $insert->advance_amount = $validated['advance_amount'];
            $insert->repayment_periods = $repayment_periods;
            $insert->monthly_deduction = $monthly_deduction;
            $insert->total_deducted = 0;
            $insert->status_id = $status_id;
            $insert->date_issued = $status_id == 1 ? date('Y-m-d') : null;
            $insert->save();
            $advance_id = $insert->id;

            for($x = 0; $x < $repayment_periods; $x ++){
                $insertPeriod = new AdvanceDeduction;
                $insertPeriod->employee_id = $employee_id;
                $insertPeriod->advance_id = $advance_id;
                $insertPeriod->payroll_id = NULL;
                $insertPeriod->deduction_amount = $monthly_deduction;
                $insertPeriod->deduction_date = NULL;
                $insertPeriod->save();
            }

            $this->updateEmployeeDeduction($employee_id, $monthly_deduction);

            DB::commit();
            return response()->json([
                'message' => 'Success in adding cash advance.',
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
            'id' => 'required|integer|exists:advances,id',
            'employee_id' => 'required|integer|exists:employees,id',
            'advance_amount' => 'required|numeric|min:1',
            'repayment_periods' => 'required|numeric|min:1',
            'monthly_deduction' => 'required|numeric|min:1',
            'status_id' => 'required|integer|exists:advance_statuses,id',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $repayment_periods = $validated['repayment_periods'];
            $monthly_deduction = $validated['monthly_deduction'];
            $status_id = $validated['status_id'];

            $update = Advance::findorFail($id);
            $employee_id = $update->employee_id;
            $date_issued_old = $update->date_issued;
            $date_cancelled = $update->date_cancelled ? $update->date_cancelled : date('Y-m-d');
            $update->advance_amount = $validated['advance_amount'];
            $update->repayment_periods = $repayment_periods;
            $update->monthly_deduction = $monthly_deduction;
            $update->total_deducted = 0;
            $update->status_id = $status_id;
            $update->date_issued = $status_id == 1 && $date_issued_old == null ? date('Y-m-d') : $date_issued_old;
            $update->date_cancelled = $status_id == 4 ? $date_cancelled : null;
            $update->save();

            $periods = AdvanceDeduction::where('advance_id',$id)->get();
            $periodCount = $periods->count();
            $periodDiff = $repayment_periods - $periodCount;

            if($periodCount>0){
                foreach($periods as $row){
                    $updatePeriod = AdvanceDeduction::find($row->id);
                    $updatePeriod->deduction_amount = $monthly_deduction;
                    $updatePeriod->save();
                }
            }

            if($periodDiff>0){
                for($x = 0; $x < $periodDiff; $x ++){
                    $insertPeriod = new AdvanceDeduction;
                    $insertPeriod->employee_id = $employee_id;
                    $insertPeriod->advance_id = $id;
                    $insertPeriod->payroll_id = NULL;
                    $insertPeriod->deduction_amount = $monthly_deduction;
                    $insertPeriod->deduction_date = NULL;
                    $insertPeriod->save();
                }
            }

            if($periodDiff<0){
                $toDelete = AdvanceDeduction::where('advance_id', $id)
                    ->orderBy('id', 'desc')
                    ->take(abs($periodDiff))
                    ->get();

                foreach ($toDelete as $deduction) {
                    $deduction->delete();
                }
            }

            $this->updateEmployeeDeduction($employee_id, $monthly_deduction);

            DB::commit();
            return response()->json([
                'message' => 'Success in updating cash advance.'
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
        try {
            
            $payroll = Advance::findOrFail($id);

            $payroll->delete();

            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete'], 500);
        }
    }

    private function fetchCode()
    {
        $yearToday = date('Y');
        $monthToday = date('m');

        $query = Advance::whereYear('created_at', $yearToday)
            ->whereMonth('created_at', $monthToday)
            ->orderBy('code','DESC')
            ->first();

        $code = $yearToday . $monthToday . '001';
        
        if ($query) {
            $lastThreeDigits = substr($query->code, -3);

            $newCodeNumber = str_pad($lastThreeDigits + 1, 3, '0', STR_PAD_LEFT);

            $code = $yearToday . $monthToday . $newCodeNumber;
        }

        return $code;
    }

    private function updateEmployeeDeduction($employee_id, $monthly_deduction)
    {
        $getDeduction = Deduction::where('name', 'Cash Advance')->first();
        if($getDeduction){
            $deduction_id = $getDeduction->id;
            $employeeDeduction = EmployeeDeduction::where('deduction_id', $deduction_id)
                ->where('employee_id', $employee_id)
                ->first();
            if($employeeDeduction){
                $employeeDeduction->amount = $monthly_deduction;
                $employeeDeduction->save();
            }else{
                $insert = new EmployeeDeduction;
                $insert->employee_id = $employee_id;
                $insert->deduction_id = $deduction_id;
                $insert->amount = $monthly_deduction;
                $insert->save();
            }
        }
    }
}