<?php 

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\PayrollDeduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DeductionController extends Controller
{
    public function index(Request $request)
    {
        $this->udpateDeduction();
        
        $query = Deduction::with('payrolls','employees');
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->where('name', 'LIKE', "%{$search}%");
                $query->orWhere('group', 'LIKE', "%{$search}%");
                $query->orWhere('type', 'LIKE', "%{$search}%");
                $query->orWhere('amount', 'LIKE', "%{$search}%");
            });
        }

        $deductions = $query->orderBy('group','ASC')->orderBy('name','ASC')->get();

        return response()->json([
            'data' => $deductions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'group' => 'nullable|string',
            'type' => 'required|string|in:amount,percentage',
            'amount' => [
                'required_if:type,amount',
                'nullable',
                'numeric',
                'min:0'
            ],
            'percentage' => [
                'required_if:type,percentage',
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],
            'ceiling' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;
            
            $insert = new Deduction;
            $insert->name = $validated['name'];
            $insert->group = $validated['group'];
            $insert->type = $validated['type'];
            $insert->amount = $validated['amount'];
            $insert->percentage = $validated['percentage'];
            $insert->ceiling = $validated['ceiling'];
            $insert->employer_amount = 0;
            $insert->save();

            $this->udpateDeduction();

            DB::commit();
            return response()->json([
                'message' => 'Success in adding new deduction.',
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
            'name' => 'required|string',
            'group' => 'nullable|string',
            'type' => 'required|string|in:amount,percentage',
            'amount' => [
                'required_if:type,amount',
                'nullable',
                'numeric',
                'min:0'
            ],
            'percentage' => [
                'required_if:type,percentage',
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],
            'ceiling' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        DB::beginTransaction();
        try{
            $user = Auth::user();
            $user_id = $user->id;

            $update = Deduction::findorFail($id);
            $update->name = $validated['name'];
            $update->group = $validated['group'];
            $update->type = $validated['type'];
            $update->amount = $validated['amount'];
            $update->percentage = $validated['percentage'];
            $update->ceiling = $validated['ceiling'];
            $update->employer_amount = 0;
            $update->save();

            $this->udpateDeduction();

            DB::commit();
            return response()->json([
                'message' => 'Success in updating deduction.'
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
            $delete = Deduction::findOrFail($id);

            $check_employee = EmployeeDeduction::where('deduction_id',$id)->first();
            $check_payroll = PayrollDeduction::where('deduction_id',$id)->first();

            if($check_employee || $check_payroll){
                return response()->json([
                    'message' => "Deduction can't be deleted",
                ], 500);
            }

            $delete->delete();            

            DB::commit();
            return response()->json([
                'message' => 'Deduction deleted successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['message' => 'Deduction not found'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete deduction'], 500);
        }
    }

    private function udpateDeduction()
    {
        $deductions = Deduction::where('amount', '>' , 0)->get();
        if($deductions->count()>0){
            foreach($deductions as $deduction){
                $deduction_id = $deduction->id;
                $amount = $deduction->amount;

                $employeesWithOutDeduction = Employee::whereDoesntHave('deductions', function ($query) use ($deduction_id) {
                        $query->where('deduction_id', $deduction_id);
                    })
                    ->where('status', 'Active')
                    ->get();
                if($employeesWithOutDeduction->count()>0){
                    $insertData = $employeesWithOutDeduction->map(function ($employee) use ($deduction_id, $amount) {
                        return [
                            'employee_id' => $employee->id,
                            'deduction_id' => $deduction_id,
                            'amount' => $amount,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    });

                    EmployeeDeduction::insert($insertData->toArray());
                }

                $update = EmployeeDeduction::where('deduction_id', $deduction_id)
                    ->where('amount', 0)
                    ->first();
                if($update){
                    $update->amount = $amount;
                    $update->save();
                }
            }
        }
    }
}
