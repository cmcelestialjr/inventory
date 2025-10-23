<?php 

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('schedule');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->where('employee_no', 'LIKE', "%{$search}%");
                $query->orWhere('lastname', 'LIKE', "%{$search}%");
                $query->orWhere('firstname', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('status')){
            $filter = $request->status;
            $query->where('status', $filter);
        }

        $employees = $query->orderBy('lastname','ASC')
            ->orderBy('firstname','ASC')
            ->paginate(10);

        $employees->getCollection()->transform(function ($employee) {
            $employee->picture = $employee->picture ? asset("storage/$employee->picture") : asset('images/user-icon.jpg');
            return $employee;
        });

        return response()->json([
            'data' => $employees->items(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'prev' => $employees->previousPageUrl(),
                'next' => $employees->nextPageUrl(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_no' => 'nullable|unique:employees',
                'lastname' => 'required|string',
                'firstname' => 'required|string',
                'middlename' => 'nullable|string',
                'extname' => 'nullable|string',
                'position' => 'required|string',
                'salary' => 'required|numeric',
                'employment_status' => 'nullable|string',
                'email' => 'nullable|email|unique:employees',
                'contact_no' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'dob' => 'nullable|date',
                'sex' => 'required|in:Male,Female',
                'status' => 'required|in:Active,Inactive',
                'address' => 'nullable|string',
                'picture' => 'nullable|image|max:2048',
            ]);

            if ($request->hasFile('picture')) {
                $validated['picture'] = $request->file('picture')->store('employees/pictures', 'public');
            }
            
            $employee = Employee::create($validated);

            $this->defaultSchedule($employee->id);

            return response()->json(['message' => 'Employee created'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        return Employee::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        try {
            $input = $request->all();
            foreach ($input as $key => $value) {
                if ($value === 'null') {
                    $input[$key] = null;
                }
            }

            $request->replace($input);

            $validated = $request->validate([
                'employee_no' => ['nullable', Rule::unique('employees')->ignore($id)],
                'lastname' => 'required|string',
                'firstname' => 'required|string',
                'middlename' => 'nullable|string',
                'extname' => 'nullable|string',
                'position' => 'required|string',
                'salary' => 'required|numeric',
                'employment_status' => 'nullable|string',
                'email' => ['nullable', 'email', Rule::unique('employees')->ignore($id)],
                'contact_no' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'dob' => 'nullable|date',
                'sex' => 'required|in:Male,Female',
                'status' => 'required|in:Active,Inactive',
                'address' => 'nullable|string',
            ]);
            $employee = Employee::findOrFail($id);

            if ($request->hasFile('picture')) {
                // Optional: delete old picture if exists
                if ($employee->picture && Storage::disk('public')->exists($employee->picture)) {
                    Storage::disk('public')->delete($employee->picture);
                }

                // Store new picture
                $validated['picture'] = $request->file('picture')->store('employees/pictures', 'public');
            }

            $employee->update($validated);
            return response()->json(['message' => 'Employee updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        return Employee::destroy($id);
    }

    public function getTotals()
    {
        $fetchTotals = Employee::selectRaw('COUNT(CASE WHEN status = "Active" THEN 1 END) as active_count, 
                            COUNT(CASE WHEN status = "Inactive" THEN 1 END) as inactive_count')
                ->first();

        $totals = [
            'active' => 0,
            'inactive' => 0
        ];

        if($fetchTotals){
            $totals = [
                'active' => $fetchTotals->active_count,
                'inactive' => $fetchTotals->inactive_count
            ];
        }
        
        return response()->json([
            'data' => $totals
        ]);
    }

    public function search(Request $request)
    {
        $search = $request->input('search');

        if (empty($search)) {
            return response()->json([]);
        }

        $employees = Employee::where('lastname', 'LIKE', "%$search%")
            ->orWhere('firstname', 'LIKE', "%$search%")
            ->orWhere('employee_no', 'LIKE', "%$search%")
            ->select('id', 'lastname', 'firstname', 'middlename', 'extname')
            ->limit(10)
            ->get();

        return response()->json($employees);
    }

    public function updateSalary(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'salary' => 'required|numeric|min:0',
            ]);

            $employee = Employee::findOrFail($id);
            $employee->salary = $validated['salary'];
            $employee->save();

            return response()->json(['message' => 'Employee salary updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function defaultSchedule($employee_id)
    {
        $check = EmployeeSchedule::where('employee_id', $employee_id)
            ->where('schedule_pay_type_id', 1)
            ->first();
        
        if($check){
            return;
        }

        $insert = new EmployeeSchedule;
        $insert->employee_id = $employee_id;
        $insert->time_in = '08:00:00';
        $insert->time_out = '17:00:00';
        $insert->schedule_pay_type_id = 1;
        $insert->save();
    }
}
