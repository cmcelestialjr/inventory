<?php

namespace App\Jobs;

use App\Models\DtrDailySummary;
use App\Models\DtrLog;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class ProcessAttendanceStatus implements ShouldQueue
{
    use Queueable, SerializesModels;

    protected $employee_id;
    protected $dateTime;
    protected $type; // 0 = in, 1 = out
    protected $log_id;

    /**
     * Create a new job instance.
     */    

    public function __construct($details)
    {
        $this->employee_id = $details['employee_id'];
        $this->dateTime = $details['dateTime'];
        $this->type = $details['type'];
        $this->log_id = $details['log_id'];
    }

    /**
     * Execute the job.
     */

    public function handle() :void
    {
        $employee_id = $this->employee_id;
        $dateTime = $this->dateTime;
        $type = $this->type;
        $log_id = $this->log_id;

        $date = Carbon::parse($dateTime)->format('Y-m-d');
        $time = Carbon::parse($dateTime)->format('H:i:s');

        $dtrLog = DtrLog::find($log_id);
        $dtrLog->is_sent = 1;
        $dtrLog->save();

        $employee = Employee::find($employee_id);
        if (!$employee) {
            return;
        }        

        // Fetch the employee's schedule for the given date
        $schedule = $this->getEmployeeSchedule($employee_id, $date, 1);
        if (!$schedule) {
            $this->checkOverTimeSchedule($employee, $date, $time, $type);
            return;
        }

        if (count($schedule->days) <= 0) {
            return;
        }

        $this->checkMonth($employee, $date, $schedule);

        // Fetch the DTR (Daily Time Record) log for the employee on this date
        $dtrSummary = DtrDailySummary::where('employee_id', $employee_id)
            ->where('date', $date)
            ->first();

        if($type == 0 && $dtrSummary->actual_in == null){
            $dtrSummary->actual_in = $time;
        }

        if($type == 1 && $dtrSummary->actual_out == null){
            $dtrSummary->actual_out = $time;
        }        
        
        $dtrSummary->save();

        if($dtrSummary->actual_out){
            $this->checkOverTime($dtrSummary);
        }

        // Calculate lateness (if actual_in is later than scheduled_in)
        $late_minutes = $this->calculateLateMinutes($dtrSummary->actual_in, $dtrSummary->schedule_in);
        
        // Calculate undertime (if actual_out is earlier than scheduled_out)
        $undertime_minutes = $this->calculateUndertimeMinutes($dtrSummary->actual_out, $dtrSummary->schedule_out);

        // Calculate deduction based on lateness and undertime
        $deduction = $this->calculateDeduction($late_minutes, $undertime_minutes, $dtrSummary->salary);

        // Calculate the earned amount
        $earned = $this->calculateEarnedAmount($dtrSummary->salary, $deduction);

        // Create or update the daily summary record
        $this->createOrUpdateDailySummary($dtrSummary, $late_minutes, $undertime_minutes, $deduction, $earned);
    }

    private function checkMonth($employee, $date, $schedule)
    {
        $employee_id = $employee->id;
        $salary = $employee->salary;
        $date_started = $employee->date_started;
        $date_separated = $employee->date_separated;
        $time_in = $schedule->time_in;
        $time_out = $schedule->time_out;
        $year = Carbon::parse($date)->format('Y');
        $month = Carbon::parse($date)->format('m');
        $lastDay = Carbon::parse($date)->endOfMonth()->format('d');

        $dtrSummary = $this->checkDtrSummary($employee_id, $date, 1);
        
        if($dtrSummary){
            return;
        }
        
        for($x = 1; $x <= $lastDay; $x++){
            $dtrDate = Carbon::parse($year.'-'.$month.'-'.$x)->format('Y-m-d');
            $dayOfWeek = Carbon::parse($dtrDate)->dayOfWeek;
            
            foreach($schedule->days as $day){
                if(
                    $dayOfWeek == $day->day_no &&
                    $date_started <= $dtrDate &&
                    ($date_separated >= $dtrDate || $date_separated==null)
                ){
                    $check = DtrDailySummary::where('employee_id', $employee_id)
                        ->where('date', $dtrDate)
                        ->first();
                    if($check){
                        $insert = new DtrDailySummary;
                        $insert->employee_id = $employee_id;
                        $insert->date = $dtrDate;
                        $insert->schedule_in = $time_in;
                        $insert->schedule_out = $time_out;
                        $insert->day = 0;
                        $insert->hour = 0;
                        $insert->minute = 0;
                        $insert->late_minutes = 0;
                        $insert->undertime_minutes = 0;
                        $insert->is_absent = 1;
                        $insert->incomplete_log = 1;
                        $insert->salary = $salary;
                        $insert->earned = 0;
                        $insert->deduction = 0;
                        $insert->schedule_pay_type_id = 1;
                    }else{
                        $insert = $check;
                        $insert->salary = $salary;
                    }
                    
                    $insert->save();
                }
            }
        }
    }

    private function checkDtrSummary($employee_id, $date, $schedule_pay_type_id)
    {
        $dtrSummary = DtrDailySummary::where('employee_id', $employee_id);
        
        if($schedule_pay_type_id == 1){
            $year = Carbon::parse($date)->format('Y');
            $month = Carbon::parse($date)->format('m');
            $dtrSummary->whereYear('date', $year)
                ->whereMonth('date', $month);
        }else{
            $dtrSummary->where('date', $date);
        }
        
        $dtrSummary = $dtrSummary->where('schedule_pay_type_id', $schedule_pay_type_id)
            ->first();

        return $dtrSummary;
    }

    /**
     * Get the employee's schedule for the specific day
     */
    private function getEmployeeSchedule($employee_id, $date, $schedule_pay_type_id)
    {
        $schedule = EmployeeSchedule::with('days','payTypes')
            ->where('employee_id', $employee_id)
            ->where('schedule_pay_type_id', $schedule_pay_type_id);
        
        if($schedule_pay_type_id == 1){
            $dayOfWeek = Carbon::parse($date)->dayOfWeek; // Convert to 1-7 (1 = Monday, 7 = Sunday)

            $schedule->whereHas('days', function ($query) use ($dayOfWeek) {
                $query->where('day_no', $dayOfWeek);
            });
        }

        $employeeSchedule = $schedule->first();

        return $employeeSchedule;
    }

    /**
     * Calculate lateness minutes (actual_in vs schedule_in)
     */
    private function calculateLateMinutes($actual_in, $schedule_in)
    {
        $actual_in = Carbon::parse($actual_in);
        $schedule_in = Carbon::parse($schedule_in);

        if ($actual_in->gt($schedule_in)) {
            return $schedule_in->diffInMinutes($actual_in);
        }
        return 0;
    }

    /**
     * Calculate undertime minutes (actual_out vs schedule_out)
     */
    private function calculateUndertimeMinutes($actual_out, $schedule_out)
    {
        $actual_out = Carbon::parse($actual_out);
        $schedule_out = Carbon::parse($schedule_out);

        if ($actual_out->lt($schedule_out)) {
            return $actual_out->diffInMinutes($schedule_out);
        }
        return 0;
    }

    /**
     * Calculate the deduction for lateness and undertime
     */
    private function calculateDeduction($late_minutes, $undertime_minutes, $salary)
    {
        $total_deduction_minutes = $late_minutes + $undertime_minutes;

        // Calculate the deduction as per the total minutes
        // Deduction can be a percentage or per minute calculation based on the salary.
        $deduction_per_minute = $salary / (8 * 60); // Assuming 8 hours/day
        return $total_deduction_minutes * $deduction_per_minute;
    }

    /**
     * Calculate the earned salary after deductions
     */
    private function calculateEarnedAmount($salary, $deduction)
    {
        return max($salary - $deduction, 0); // Earned salary can't be less than 0
    }

    /**
     * Insert or update the daily summary record
     */
    private function createOrUpdateDailySummary(
        $dtrSummary, $late_minutes, $undertime_minutes, $deduction, $earned
    )
    {
        if($dtrSummary->actual_in && $dtrSummary->actual_out){
            $dtrSummary->incomplete_log = 0;
        }
        $dtrSummary->is_absent = 0;
        $dtrSummary->late_minutes = $late_minutes;
        $dtrSummary->undertime_minutes = $undertime_minutes;
        $dtrSummary->deduction = $deduction;
        $dtrSummary->earned = $earned;
        $dtrSummary->save();
    }

    private function checkOverTimeSchedule($employee, $date, $time, $type)
    {
        $employee_id = $employee->id;
        $salary = $employee->salary;

        $overTimeSchedule = $this->getEmployeeSchedule($employee_id, $date, 2);
        
        if (!$overTimeSchedule) {
            return;
        }
        
        $time_in = $overTimeSchedule->time_out;
        $time_out = $overTimeSchedule->time_out;

        $dtrSummary = $this->checkDtrSummary($employee_id, $date, 2);

        if(!$dtrSummary){
            $insert = new DtrDailySummary;
            $insert->employee_id = $employee_id;
            $insert->date = $date;
            $insert->schedule_in = $time_in;
            $insert->schedule_out = $time_out;
            $insert->day = 0;
            $insert->hour = 0;
            $insert->minute = 0;
            if($type == 0){
                $insert->actual_in = $time;
            }
            if($type == 1){
                $insert->actual_out = $time;
            }
            $insert->late_minutes = 0;
            $insert->undertime_minutes = 0;
            $insert->is_absent = 0;
            $insert->incomplete_log = 1;
            $insert->salary = $salary;
            $insert->earned = 0;
            $insert->deduction = 0;
            $insert->schedule_pay_type_id = 2;
            $insert->save();

            $dtrSummary = $insert;
        } else {
            if($type == 0){
                $dtrSummary->actual_in = $time;
            }
            if($type == 1){
                $dtrSummary->actual_out = $time;
            }
            $dtrSummary->save();
        }
        
        $this->checkOverTime($dtrSummary);
    }

    private function checkOverTime($dtrSummary)
    {
        $employee_id = $dtrSummary->employee_id;
        $date = $dtrSummary->date;
        $salary = $dtrSummary->salary;
        
        $overTimeSchedule = $this->getEmployeeSchedule($employee_id, $date, 2);
        
        if (!$overTimeSchedule) {
            return;
        }

        $actual_in = $dtrSummary->actual_in;
        $actual_out = $dtrSummary->actual_out;

        if($actual_in && $actual_out){
            
            $schedule_in = $overTimeSchedule->time_in;
            $schedule_out = $overTimeSchedule->time_out;
            $pay_multiplier = $overTimeSchedule->payTypes->pay_multiplier;

            if($actual_out < $schedule_in){
                return;
            }           

            $time_in = $actual_in > $schedule_in ? $actual_in : $schedule_in;
            $time_out = $actual_out < $schedule_out ? $actual_out : $schedule_out;

            $over_time_in = Carbon::parse($time_in);
            $over_time_out = Carbon::parse($time_out);
            
            $overtimeMinutes = $over_time_in->diffInMinutes($over_time_out);
            
            if($overtimeMinutes > 0){
                $this->processOverTime(
                    $employee_id, 
                    $date, 
                    $schedule_in, 
                    $schedule_out, 
                    $actual_in, 
                    $actual_out, 
                    $salary, 
                    $overtimeMinutes, 
                    $pay_multiplier,
                    $dtrSummary
                );
            }
        }
    }

    private function processOverTime(
        $employee_id, 
        $date, 
        $schedule_in, 
        $schedule_out, 
        $actual_in, 
        $actual_out, 
        $salary, 
        $overtimeMinutes, 
        $pay_multiplier,
        $dtrSummary
    )
    {
        $salary_per_minute = ($salary * $pay_multiplier) / (8 * 60);
        $earned = round(($overtimeMinutes * $salary_per_minute), 2);

        $hour = floor($overtimeMinutes / 60);
        $minute = $overtimeMinutes % 60;

        if($dtrSummary->schedule_pay_type_id == 1){

            $dtrSummary = $this->checkDtrSummary($employee_id, $date, 2);

            if(!$dtrSummary){
                $insert = new DtrDailySummary;
                $insert->employee_id = $employee_id;
                $insert->date = $date;
                $insert->schedule_in = $schedule_in;
                $insert->schedule_out = $schedule_out;
                $insert->actual_in = $actual_in;
                $insert->actual_out = $actual_out;                
                $insert->day = 0;                
            }else{
                $insert = $dtrSummary;
            }
        }else{
            $insert = $dtrSummary;
        }
        $insert->salary = $salary;
        $insert->hour = $hour;
        $insert->minute = $minute;
        $insert->earned = $earned;
        $insert->late_minutes = 0;
        $insert->undertime_minutes = 0;
        $insert->is_absent = 0;
        $insert->incomplete_log = 0;
        $insert->deduction = 0;
        $insert->schedule_pay_type_id = 2;
        $insert->save();
    }
    
}
