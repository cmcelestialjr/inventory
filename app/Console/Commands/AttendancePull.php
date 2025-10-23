<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAttendanceStatus;
use App\Models\DtrDevice;
use App\Models\DtrLog;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Rats\Zkteco\Lib\ZKTeco;

class AttendancePull extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:pull';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $query = DtrDevice::where('status','Active')
                ->where('power_state','On')
                ->orderBy('id','DESC')
                ->get();
        if($query->count()>0){
            foreach($query as $row){
                $id = $row->id;
                $ipaddress = $row->ipaddress;
                $port = $row->port;
                //$this->process(new ZKTeco($ipaddress,$port), $id, $id);

                $this->process(new ListHandler(), $id, $id);
            }
        }

        
    }

    private function process($zk, $dtr_device_id, $id)
    {
        if ($zk->connect()){
            $attendace = $zk->getAttendance();
            $recordsCheck = 0;
            foreach($attendace as $row){
                $employee_no = $row['id'];
                $state = $row['state']; //1 finger, 15 face
                $dateTime = date('Y-m-d H:i:s', strtotime($row['timestamp']));
                $type = $row['type']; //0 in, 1 out
                $employee = Employee::where('employee_no', $employee_no)->first();

                $record = DtrLog::where('employee_no', $employee_no)
                    ->where(DB::raw("DATE_FORMAT(dateTime, '%Y-%m-%d %H:%i')"), date('Y-m-d H:i', strtotime($dateTime)))
                    ->value('id');
                if ($record === null && $employee) {
                    try {
                        $employee_id = $employee->id;

                        $insert = DTRlog::updateOrCreate(
                            [
                                'employee_id' => $employee_id,
                                'employee_no' => $employee_no,
                                'datetime' => $dateTime,
                            ],
                            [
                                'dtr_device_id' => $dtr_device_id,
                                'state' => $state,
                                'log_type' => $type,
                                'updated_to_daily' => 0,
                                'is_sent' => 0
                            ]
                        );
                        $log_id = $insert->id;

                        $this->isSent($log_id, $employee_id, $dateTime, $type);
                        
                        $recordsCheck++;

                    } catch (\Exception $e) {
                        $this->error("Error: " . $e->getMessage());
                    }
                }
            }

            $this->clearAttendance($zk, $recordsCheck);            

        }else{            
            $this->updateStatus($id);
            exit;
        }   
    }

    private function isSent($log_id, $employee_id, $dateTime, $type)
    {
        $dtrLog = DTRLog::find($log_id);
        $is_sent = $dtrLog->is_sent;
        if($is_sent==0 || $is_sent==null){
            

            $details = [
                'employee_id' => $employee_id,
                'dateTime' => $dateTime,
                'type' => $type,
                'log_id' => $log_id
            ];

            // new ProcessAttendanceStatus1($details);

            dispatch((new ProcessAttendanceStatus($details))->onQueue('dtr'));

            
        }
    }

    private function clearAttendance($zk, $recordsCheck)
    {
        if($recordsCheck==0){
            $now = now();
            if (
                $now->isBetween('11:45', '11:46') ||
                $now->isBetween('14:30', '14:31')
            ) {
                    
                $zk->clearAttendance();
            }
        }
    }

    private function updateStatus($id){
        DtrDevice::where('id', $id)
                ->update(['power_state' => 'Off',
                        'dateTime' => NULL]);
    }
}


class ListHandler {

    public function connect() {
        return true;
    }

    public function getAttendance() {
        return [
            [
                'id' => 123,
                'state' => 1,
                'timestamp' => date('Y-m-d H:i:s', strtotime('2025-09-28 08:05:00')),
                'type' => 0
            ],
            [
                'id' => 123,
                'state' => 1,
                'timestamp' => date('Y-m-d H:i:s', strtotime('2025-09-28 20:05:00')),
                'type' => 1
            ]
        ];
    }

    public function clearAttendance() {
        return true;
    }
}