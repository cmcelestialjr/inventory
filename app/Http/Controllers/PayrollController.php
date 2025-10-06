<?php 

namespace App\Http\Controllers;

use App\Models\AdvanceDeduction;
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

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $query = Payroll::with('payrollType','employees.deductionList.deduction')
            ->withCount('employees');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->where('etal', 'LIKE', "%{$search}%");
                $query->orWhere('code', 'LIKE', "%{$search}%");
                $query->orWhereHas('payrollType', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        if ($request->has('year')){
            $year = $request->year;
            $query->where('year', $year);
        }

        $payrolls = $query->orderBy('code','ASC')
            ->get();

        return response()->json([
            'data' => $payrolls
        ]);
    }

    public function listEmployee(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|numeric',
            'month' => 'required|numeric',
            'payrollType' => 'required|numeric|min:1',
            'payrollOption' => 'nullable|string',
            'dayRange' => 'nullable|string',
            'week' => 'nullable|string',
            'includeOt' => 'required|string|in:Yes,No',
        ]);

        $year = $validated['year'];
        $month = $validated['month'];
        $payrollType = $validated['payrollType'];
        $payrollOption = $validated['payrollOption'];
        $dayRange = $validated['dayRange'];
        $week = $validated['week'];
        $includeOt = $validated['includeOt'];
        $status = 'Active';

        $getDateFromTo = $this->getDateFromTo($payrollOption, $dayRange, $year, $month, $week);
        $date_from = $getDateFromTo['date_from'];
        $date_to = $getDateFromTo['date_to'];

        $this->checkCashAdvances();

        $query = Employee::with([
                'deductions' => function ($q) {
                    $q->select('employee_id', 'deduction_id', 'amount');
                },
                'dtr_summary' => function ($q) use ($date_from, $date_to) {
                    $q->whereBetween('date', [$date_from, $date_to]);
                },
                'advanceDeduction'
            ])->withSum('deductions', 'amount');

        $query->whereDoesntHave('payrollMonths', function ($q) use ($year,$month,$date_from,$date_to,$payrollType) {
            $q->where('year', $year);
            $q->where('month', $month);
            $q->whereHas('payroll', function ($q) use ($year,$date_from,$date_to,$payrollType) {
                $q->where('year', $year);
                $q->where('payroll_type_id', $payrollType);
                $q->where(function($q) use ($date_from, $date_to) {
                    $q->where(function($query) use ($date_from) {
                        $query->where('date_from', '<=', $date_from)
                            ->where('date_to', '>=', $date_from);
                    });
                    $q->orWhere(function($query) use ($date_to) {
                        $query->where('date_from', '<=', $date_to)
                            ->where('date_to', '>=', $date_to);
                    });
                });
            });
        });

        $employees = $query->where('status', $status)
            ->orderBy('lastname','ASC')
            ->orderBy('firstname','ASC')
            ->get();

        $employeeLists = [];

        if($employees->count()>0){
            foreach($employees as $employee){
                $extname = ' '.$employee->extname ? $employee->extname.' ' : '';
                $middlename = ' '.$employee->middlename ? substr($employee->middlename, 0, 1) . '.' : '';
                $deduction = $employee->deductions_sum_amount ? $employee->deductions_sum_amount : 0;

                $regular_earned = 0;
                $regular_deduction = 0;
                $overtime_earned = 0;
                $overtime_deduction = 0;
                $no_of_day_present = 0;
                $lates_absences = 0;
                $lates = 0;
                $absences = 0;
                $no_of_lates = 0;
                $no_of_undertimes = 0;
                $no_of_absences = 0;

                if ($employee->dtr_summary) {
                    foreach ($employee->dtr_summary as $dtr) {
                        if($dtr->is_absent==1){
                            $absences += $dtr->late_minutes;
                            $no_of_absences++;
                        }else{
                            if ($dtr->schedule_pay_type_id == 1) {
                                $regular_earned += $dtr->earned;
                                $regular_deduction += $dtr->deduction;
                                $lates_absences += $dtr->deduction;
                                $lates += $dtr->late_minutes + $dtr->undertime_minutes;

                                $no_of_day_present++;

                                if($dtr->late_minutes){
                                    $no_of_lates++;
                                }

                                if($dtr->no_of_undertimes){
                                    $no_of_undertimes++;
                                }

                            } elseif ($dtr->schedule_pay_type_id == 2) {
                                $overtime_earned += $dtr->earned;
                            }
                        }
                    }
                }

                $deductions = $deduction + $regular_deduction;
                $earned = $regular_earned + $overtime_earned;
                $gross = $earned-$regular_deduction;
                $netpay = $earned - $deductions;

                $employeeLists[] = [
                    'id' => $employee->id,
                    'name' => $employee->lastname . ', ' . $employee->firstname . $extname . $middlename,
                    'lastname' => $employee->lastname,
                    'firstname' => $employee->firstname,
                    'middlename' => $employee->middlename,
                    'extname' => $employee->extname,
                    'position' => $employee->position,
                    'salary' => $employee->salary,
                    'earned' => $earned,
                    'overtime' => $overtime_earned,
                    'gross' => $gross,
                    'deduction' => $deductions,                    
                    'netpay' => $netpay,
                    'no_of_day_present' => $no_of_day_present,
                    'lates_absences' => $lates_absences,
                    'lates' => $lates,
                    'absences' => $absences,
                    'no_of_lates' => $no_of_lates,
                    'no_of_undertimes' => $no_of_undertimes,
                    'no_of_absences' => $no_of_absences,
                    'deductions' => $employee->deductions,
                ];
            }
        }
        
        return response()->json([
            'data' => $employeeLists
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|numeric',
            'month' => 'required|numeric',
            'payrollType' => 'required|numeric|min:1',
            'payrollOption' => 'nullable|string',
            'dayRange' => 'nullable|string',
            'week' => 'nullable|string',
            'includeOt' => 'required|string|in:Yes,No',
            'employees' => 'required|array|min:1',
            'employees.*.id' => 'required|integer|exists:employees,id',
            'employees.*.lastname' => 'required|string|max:255',
            'employees.*.firstname' => 'required|string|max:255',
            'employees.*.middlename' => 'nullable|string|max:255',
            'employees.*.extname' => 'nullable|string|max:255',
            'employees.*.position' => 'required|string|max:255',
            'employees.*.salary' => 'required|numeric|min:0',
            'employees.*.deduction' => 'required|numeric|min:0',
            'employees.*.earned' => 'required|numeric|min:0',
            'employees.*.overtime' => 'required|numeric|min:0',            
            'employees.*.gross' => 'required|numeric|min:0',
            'employees.*.netpay' => 'required|numeric',
            'employees.*.no_of_day_present' => 'required|integer|min:0',
            'employees.*.lates_absences' => 'required|integer|min:0',
            'employees.*.lates' => 'required|integer|min:0',
            'employees.*.absences' => 'required|integer|min:0',
            'employees.*.no_of_lates' => 'required|integer|min:0',
            'employees.*.no_of_undertimes' => 'required|integer|min:0',
            'employees.*.no_of_absences' => 'required|integer|min:0',
            'employees.*.deductions' => 'nullable|array',
            'employees.*.deductions.*.employee_id' => 'required|integer|exists:employees,id',
            'employees.*.deductions.*.deduction_id' => 'required|integer|exists:deductions,id',
            'employees.*.deductions.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $year = $validated['year'];
            $month = date('m',strtotime($year.'-'.$validated['month'].'-01'));

            $payrollCode = $this->getCode($year, $month);

            $year = $validated['year'];
            $month = $validated['month'];
            $payrollOption = $validated['payrollOption'];
            $dayRange = $validated['dayRange'];
            $week = $validated['week'];

            $getDateFromTo = $this->getDateFromTo($payrollOption, $dayRange, $year, $month, $week);
            $date_from = $getDateFromTo['date_from'];
            $date_to = $getDateFromTo['date_to'];
            $period = $getDateFromTo['period'];            

            $insert = new Payroll();
            $insert->payroll_type_id = 1;
            $insert->code = $payrollCode;
            $insert->year = $year;
            $insert->month = $month;
            $insert->type = $validated['payrollOption'];
            $insert->day_range = $validated['dayRange'];
            $insert->week_range = $validated['week'];
            $insert->period = $period;
            $insert->date_from = $date_from;
            $insert->date_to = $date_to;
            $insert->etal = '';
            $insert->earned = 0;
            $insert->gross = 0;
            $insert->lwop = 0;
            $insert->deduction = 0;
            $insert->netpay = 0;
            $insert->created_by = $user_id;
            $insert->save();
            $payroll_id = $insert->id;

            $employees = $validated['employees'];

            $etal = '';
            $x = 0;
            $earned = 0;
            $gross = 0;
            $lwop = 0;
            $deduction = 0;
            $netpay = 0;
            
            foreach ($employees as $employee) {
                if($x==0){
                    $etal = $employee['lastname'];
                }

                $payroll_employee_id = $this->payrollEmployees($payroll_id, $employee);

                $this->payrollMonths($year, $month, $payroll_employee_id, $payroll_id, $employee);

                if (isset($employee['deductions'])) {
                    $this->payrollDeductions($payroll_employee_id, $payroll_id, $employee['deductions']);
                }

                $x++;
                $earned += $employee['earned'];
                $gross += $employee['gross'];
                $lwop += $employee['lates'];
                $deduction += $employee['deduction'];
                $netpay += $employee['netpay'];
            }

            $etal = $x > 1 ? $etal.' etal' : $etal;

            $payroll = Payroll::find($payroll_id);
            $payroll->etal = $etal;
            $payroll->earned = $earned;
            $payroll->gross = $gross;
            $payroll->lwop = $lwop;
            $payroll->deduction = $deduction;
            $payroll->netpay = $netpay;
            $payroll->save();

            DB::commit();
            return response()->json([
                'message' => 'Payroll created successfully!',
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
            'date_to_bank' => 'required|date',
        ]);

        try {

            $payroll = Payroll::findOrFail($id);
            $payroll->date_to_bank = date('Y-m-d', strtotime($validated['date_to_bank']));
            $payroll->save();

            return response()->json(['message' => 'Payroll date updated successfully'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Payroll not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update payroll'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $payroll = Payroll::findOrFail($id);

            if($payroll->date_to_bank != null){
                return response()->json(['message' => 'Payroll deleted successfully'], 200);
            }
            
            AdvanceDeduction::where('payroll_id', $id)
                    ->update(['payroll_id' => NULL]);

            PayrollDeduction::where('payroll_id',$id)->delete();
            PayrollEmployee::where('payroll_id',$id)->delete();
            PayrollMonth::where('payroll_id',$id)->delete();

            $payroll->delete();

            return response()->json(['message' => 'Payroll deleted successfully'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Payroll not found'], 404);
        } catch (\Exception $e) {
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

    private function payrollDeductions($payroll_employee_id, $payroll_id, $deductions)
    {
        $ca_deduction_id = $this->getCAdeductionId();

        $insertData = [];
        $employeeIds = [];

        foreach($deductions as $deduction){
            $insertData[] = [
                'payroll_employee_id' => $payroll_employee_id,
                'payroll_id' => $payroll_id,
                'employee_id' => $deduction['employee_id'],
                'deduction_id' => $deduction['deduction_id'],
                'amount' => $deduction['amount'],
                'created_at' => now(),
                'updated_at' => now()
            ];

            if ($ca_deduction_id == $deduction['deduction_id'] && $deduction['amount'] > 0) {
                $updateCA = AdvanceDeduction::where('employee_id', $deduction['employee_id'])
                    ->where('deduction_amount', $deduction['amount'])
                    ->whereNull('payroll_id')
                    ->first();

                if ($updateCA) {
                    $updateCA->payroll_id = $payroll_id;
                    $updateCA->save();
                }

                $employeeIds[] = $deduction['employee_id'];
                
            }
        }

        PayrollDeduction::insert($insertData);

        if(!empty($employeeIds)){
            EmployeeDeduction::whereIn('employee_id', $employeeIds)
                    ->where('deduction_id', $ca_deduction_id)
                    ->update(['amount' => 0]);
        }

    }

    private function payrollEmployees($payroll_id, $employee)
    {
        $insert = new PayrollEmployee();
        $insert->payroll_id = $payroll_id;
        $insert->employee_id = $employee['id'];
        $insert->lastname = $employee['lastname'];
        $insert->firstname = $employee['firstname'];
        $insert->middlename = $employee['middlename'];
        $insert->extname = $employee['extname'];
        $insert->position = $employee['position'];
        $insert->salary = $employee['salary'];
        $insert->no_of_day_present = $employee['no_of_day_present'];
        $insert->earned = $employee['earned'];
        $insert->overtime = $employee['overtime'];
        $insert->holiday = 0;
        $insert->lates_absences = $employee['lates_absences'];
        $insert->gross = $employee['gross'];
        $insert->deduction = $employee['deduction'];
        $insert->netpay = $employee['netpay'];
        $insert->lates = $employee['lates'];
        $insert->absences = $employee['absences'];
        $insert->no_of_lates = $employee['no_of_lates'];
        $insert->no_of_undertimes = $employee['no_of_undertimes'];
        $insert->no_of_absences = $employee['no_of_absences'];
        $insert->save();

        return $insert->id;
    }

    private function payrollMonths($year, $month, $payroll_employee_id, $payroll_id, $employee)
    {
        $insert = new PayrollMonth();
        $insert->payroll_employee_id = $payroll_employee_id;
        $insert->payroll_id = $payroll_id;
        $insert->employee_id = $employee['id'];
        $insert->year = $year;
        $insert->month = $month;
        $insert->amount = $employee['earned'];
        $insert->earned = $employee['earned'];
        $insert->save();
    }

    private function getCode($year, $month)
    {
        $query = Payroll::where('year',$year)
            ->where('month',$month)
            ->orderBy('code','DESC')
            ->first();
        if ($query) {
            $lastCode = $query->code;            
            $lastNumber = substr($lastCode, -4);            
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $code = $year . $month . $newNumber;
        } else {
            $code = $year . $month . '0001';
        }
        return $code;
    }

    private function getDateFromTo($payrollOption, $dayRange, $year, $month, $week)
    {
        switch ($payrollOption) {
            case 'semi-monthly':
                $exp = explode('-', $dayRange);
                $date_from = date('Y-m-d', strtotime("$year-$month-$exp[0]"));
                $date_to   = date('Y-m-d', strtotime("$year-$month-$exp[1]"));
                break;

            case 'weekly':
                $exp = explode('-', $week);
                $date_from = date('Y-m-d', strtotime($exp[0]));
                $date_to   = date('Y-m-d', strtotime($exp[1]));
                break;

            default:
                $date_from = date('Y-m-d', strtotime("$year-$month-01"));
                $date_to   = date('Y-m-t', strtotime("$year-$month-01"));
                break;
        }

        $dateFrom = new DateTime($date_from);
        $dateTo = new DateTime($date_to);

        if ($dateFrom->format('Y-m') === $dateTo->format('Y-m')) {
            $period = $dateFrom->format('M d') . '-' . $dateTo->format('d, Y');
        } else {
            $period = $dateFrom->format('M d, Y') . ' - ' . $dateTo->format('M d, Y');
        }

        return [
            'date_from' => $date_from,
            'date_to' => $date_to,
            'period' => $period
        ];
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

    private function checkCashAdvances()
    {
        $employeesWithCA = Employee::whereHas('advanceDeduction')
            ->with('advanceDeduction:employee_id,deduction_amount')
            ->get(['id']);

        if ($employeesWithCA->isEmpty()) {
            return;
        }

        $deduction_id = $this->getCAdeductionId();
        $now = now();

        foreach ($employeesWithCA as $employee) {
            EmployeeDeduction::updateOrCreate(
                [
                    'deduction_id' => $deduction_id, 
                    'employee_id' => $employee->id
                ],
                [
                    'amount' => $employee->advanceDeduction->deduction_amount,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    private function getCAdeductionId()
    {
        $deduction = Deduction::where('name','Cash Advance')->first();

        if(!$deduction){

            $insert = new Deduction;
            $insert->name = 'Cash Advance';
            $insert->type = 'amount';
            $insert->amount = 0;
            $insert->percentage = 0;
            $insert->ceiling = 0;
            $insert->employer_amount = 0;
            $insert->save();

            return $insert->id;
        }

        return $deduction->id;
    }
}
