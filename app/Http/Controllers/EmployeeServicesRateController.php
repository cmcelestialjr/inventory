<?php 

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\EmployeeServiceRate;
use App\Models\SchedulePayType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeServicesRateController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:employees,id',
        ]);
        $query = EmployeeServiceRate::with('service')
            ->where('employee_id',$validated['id'])
            ->get();

        return response()->json([
            'data' => $query
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'service_id' => 'required|exists:services,id',
                'service_amount_rate' => 'required|numeric|min:0',
                'service_percentage_rate' => 'required|numeric|min:0',
                'rate_type' => 'required|string|in:amount,percentage',
            ]);
            
            EmployeeServiceRate::create($validated);

            return response()->json(['message' => 'Employee created'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'service_id' => 'required|exists:services,id',
                'service_amount_rate' => 'required|numeric|min:0',
                'service_percentage_rate' => 'required|numeric|min:0',
                'rate_type' => 'required|string|in:amount,percentage',
            ]);

            $query = EmployeeServiceRate::findOrFail($id);

            $query->update($validated);

            return response()->json(['message' => 'Employee service rate updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        return EmployeeServiceRate::destroy($id);
    }

}
