<?php 

namespace App\Http\Controllers;

use App\Models\DtrDailySummary;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AttendancesController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|numeric',
            'month' => 'required|numeric',
            'search' => 'nullable|string',
        ]);

        $year = $validated['year'];
        $month = $validated['month'];
        $search = $validated['search'];
        
        $query = Employee::with(['regularAttendances' => function ($query) use ($year, $month) 
                {
                    $query->whereYear('date', $year)
                        ->whereMonth('date', $month);
                }
            ])
            ->with(['overTimeAttendances' => function ($query) use ($year, $month) 
                {
                $query->whereYear('date', $year)
                    ->whereMonth('date', $month);
                }
            ])
            ->with(['schedules'])
            ->where('status','Active');

        if (!empty($search)) {
            $query->where(function ($query) use ($search) {
                $query->where('employee_no', 'LIKE', "%{$search}%");
                $query->orWhere('lastname', 'LIKE', "%{$search}%");
                $query->orWhere('firstname', 'LIKE', "%{$search}%");
            });
        }

        $employees = $query->get();
        
        return response()->json([
            'data' => $employees
        ]);
    }

    public function fetch()
    {
        
    }

    public function store(Request $request)
    {
        
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'employee_id' => 'required|integer|exists:employees,id',  // Validate employee_id exists in the employees table
                'date' => 'required|date',  // Validate date is a valid date
                'salary' => 'required|numeric|min:0',  // Validate salary is numeric and greater than or equal to 0
                'regularTimeIn' => 'nullable|date_format:H:i:s',  // Validate regularTimeIn is in H:i:s format, nullable
                'regularTimeOut' => 'nullable|date_format:H:i:s',  // Validate regularTimeOut is in H:i:s format, nullable
                'actualTimeIn' => 'nullable|date_format:H:i:s',  // Validate actualTimeIn is in H:i:s format, nullable
                'actualTimeOut' => 'nullable|date_format:H:i:s',  // Validate actualTimeOut is in H:i:s format, nullable
                'overTimeIn' => 'nullable|date_format:H:i:s',  // Validate overTimeIn is in H:i:s format, nullable
                'overTimeOut' => 'nullable|date_format:H:i:s',  // Validate overTimeOut is in H:i:s format, nullable
                'earned' => 'required|numeric|min:0',  // Validate earned is numeric and greater than or equal to 0
                'otEarned' => 'required|numeric|min:0',  // Validate otEarned is numeric and greater than or equal to 0
                'totalEarned' => 'required|numeric|min:0',  // Validate totalEarned is numeric and greater than or equal to 0
                'day' => 'required|integer|between:0,31',  // Validate day is an integer between 1 and 31
                'hour' => 'required|integer|between:0,23',  // Validate hour is an integer between 0 and 23
                'minute' => 'required|integer|between:0,59',  // Validate minute is an integer between 0 and 59
                'otHour' => 'required|integer|between:0,23',  // Validate otHour is an integer between 0 and 23
                'otMinute' => 'required|integer|between:0,59',  // Validate otMinute is an integer between 0 and 59
                'lates' => 'required|integer|min:0',
                'underTime' => 'required|integer|min:0',
            ]);

            $date = date('Y-m-d', strtotime($validated['date']));
            $salary = $validated['salary'];
            $actual_in = $validated['actualTimeIn'];
            $actual_out = $validated['actualTimeOut'];

            $total_deduction_minutes = $validated['lates'] + $validated['underTime'];
            $deduction_per_minute = $salary / (8 * 60);
            $deduction = $total_deduction_minutes * $deduction_per_minute;

            $query = DtrDailySummary::where('employee_id', $id)
                ->where('date', $date)
                ->where('schedule_pay_type_id', 1)
                ->first();

            if(!$query){
                $insert = new DtrDailySummary;
                $insert->employee_id = $id;
                $insert->date = $date;                
                $insert->schedule_pay_type_id = 1;
            }else{
                $insert = $query;
            }
            
            $insert->schedule_in = $validated['regularTimeIn'];
            $insert->schedule_out = $validated['regularTimeOut'];
            $insert->actual_in = $validated['actualTimeIn'];
            $insert->actual_out = $validated['actualTimeOut'];
            $insert->day = $validated['day'];
            $insert->hour = $validated['hour'];
            $insert->minute = $validated['minute'];
            $insert->late_minutes = $validated['lates'];
            $insert->undertime_minutes = $validated['underTime'];

            if($actual_in && $actual_out){
                $insert->is_absent = 0;
                $insert->incomplete_log = 0;
            }elseif(($actual_in && !$actual_out) || (!$actual_in && $actual_out)){
                $insert->is_absent = 0;
                $insert->incomplete_log = 1;
            }else{
                $insert->is_absent = 1;
                $insert->incomplete_log = 1;
            }
            
            $insert->salary = $salary;
            $insert->earned = $validated['earned'];
            $insert->deduction = $deduction;
            $insert->save();

            if($validated['overTimeIn'] || $validated['overTimeOut']){
                $this->updateOverTime($validated);
            }

            return response()->json(['message' => 'Success'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        
    }

    private function updateOverTime($validated)
    {
        $id = $validated['employee_id'];

        $date = date('Y-m-d', strtotime($validated['date']));
        $salary = $validated['salary'];

        $query = DtrDailySummary::where('employee_id', $id)
            ->where('date', $date)
            ->where('schedule_pay_type_id', 2)
            ->first();

        if(!$query){
            $insert = new DtrDailySummary;
            $insert->employee_id = $id;
            $insert->date = $date;                
            $insert->schedule_pay_type_id = 2;
        }else{
            $insert = $query;
        }

        $insert->schedule_in = $validated['overTimeIn'];
        $insert->schedule_out = $validated['overTimeOut'];
        $insert->actual_in = $validated['actualTimeIn'];
        $insert->actual_out = $validated['actualTimeOut'];
        $insert->day = 0;
        $insert->hour = $validated['otHour'];
        $insert->minute = $validated['otMinute'];
        $insert->late_minutes = 0;
        $insert->undertime_minutes = 0;
        $insert->is_absent = 0;
        $insert->incomplete_log = 0;            
        $insert->salary = $salary;
        $insert->earned = $validated['otEarned'];
        $insert->deduction = 0;
        $insert->save();
    }

}
