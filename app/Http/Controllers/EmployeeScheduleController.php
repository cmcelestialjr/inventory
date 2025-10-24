<?php 

namespace App\Http\Controllers;

use App\Models\EmployeeSchedule;
use App\Models\EmployeeScheduleDay;
use App\Models\SchedulePayType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeScheduleController extends Controller
{
    public function index(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|exists:employees,id'
        ]);

        $employee_id = $validatedData['id'];

        $this->checkSchedule($employee_id);

        return EmployeeSchedule::with('payTypes','days')->where('employee_id', $employee_id)->get();        
    }

    public function update(Request $request)
    {
        try{
            $validatedId = $request->validate([
                'id' => 'required|exists:employee_schedules,id'
            ]);
            $request->merge([
                'time_in' => ($request->input('time_in') === 'None') ? null : $request->input('time_in'),
                'time_out' => ($request->input('time_out') === 'None') ? null : $request->input('time_out')
            ]);

            $validatedData = $request->validate([
                'time_in' => 'nullable|date_format:H:i:s',
                'time_out' => 'nullable|date_format:H:i:s|after:time_from'
            ]);

            $id = $validatedId['id'];

            $sched = EmployeeSchedule::findOrFail($id);

            $sched->update($validatedData);

            if($sched->schedule_pay_type_id==1){
                $validatedDays = $request->validate([
                    'days' => 'required|array|in:Sun,Mon,Tue,Wed,Thu,Fri,Sat'
                ]);

                $schedule_id = $sched->id;

                EmployeeScheduleDay::where('schedule_id',$schedule_id)
                    ->whereNotIn('shorten',$validatedDays['days'])
                    ->delete();
                
                $existingDays = EmployeeScheduleDay::where('schedule_id', $schedule_id)
                    ->pluck('shorten')
                    ->toArray();

                $newDays = array_diff($validatedDays['days'], $existingDays);

                if (!empty($newDays)) {
                    $data = array_map(function ($day) use ($schedule_id) {
                        return [
                            'schedule_id' => $schedule_id, 
                            'name' => $this->dayName($day),
                            'shorten' => $day,
                            'day_no' => $this->dayNo($day)
                        ];
                    }, $newDays);

                    EmployeeScheduleDay::insert($data);
                }
            }

            return response()->json(['message' => 'Employee schedule updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function checkSchedule($employee_id)
    {
        $schedulePayTypeIds = SchedulePayType::pluck('id')->toArray();

        if (empty($schedulePayTypeIds)) {
            return;
        }

        $existing = EmployeeSchedule::where('employee_id', $employee_id)
            ->pluck('schedule_pay_type_id')
            ->toArray();

        $missing = array_diff($schedulePayTypeIds, $existing);

        $insertData = [];
        foreach ($missing as $schedulePayTypeId) {
            $insertData[] = [
                'employee_id' => $employee_id,
                'schedule_pay_type_id' => $schedulePayTypeId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($insertData)) {
            EmployeeSchedule::insert($insertData);
        }
    }

    private function dayName($day)
    {
        $days = [
            'Sun' => 'Sunday',
            'Mon' => 'Monday',
            'Tue' => 'Tuesday',
            'Wed' => 'Wednesday',
            'Thu' => 'Thursday',
            'Fri' => 'Friday',
            'Sat' => 'Saturday',
        ];

        return $days[$day];
    }

    private function dayNo($day)
    {
        $days = [
            'Sun' => 0,
            'Mon' => 1,
            'Tue' => 2,
            'Wed' => 3,
            'Thu' => 4,
            'Fri' => 5,
            'Sat' => 6,
        ];

        return $days[$day];
    }

}
