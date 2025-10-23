<?php 

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeOtherEarning;
use App\Models\EmployeeSchedule;
use App\Models\EmployeeServiceRate;
use App\Models\SchedulePayType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeOtherEarningsController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:employees,id',
        ]);
    
        $query = EmployeeOtherEarning::with('type')
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
                'earning_type_id' => 'required|exists:earning_types,id',
                'amount' => 'required|numeric|min:1',
            ]);
            
            EmployeeOtherEarning::create($validated);

            return response()->json(['message' => 'Employees other earnings created'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'earning_type_id' => 'required|exists:earning_types,id',
                'amount' => 'required|numeric|min:1',
            ]);

            $query = EmployeeOtherEarning::findOrFail($id);

            $query->update($validated);

            return response()->json(['message' => 'Employees other earnings updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        return EmployeeOtherEarning::destroy($id);
    }

}
