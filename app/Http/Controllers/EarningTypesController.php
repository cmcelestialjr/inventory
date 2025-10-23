<?php 

namespace App\Http\Controllers;

use App\Models\EarningType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EarningTypesController extends Controller
{
    public function index(Request $request)
    {
        
    }

    public function fetch()
    {
        $types = EarningType::get();
        
        return response()->json($types);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:earning_types,name',
                'type' => 'required|string|in:daily,hourly,fixed'
            ]);
            
            EarningType::create($validated);

            return response()->json(['message' => 'Earnings Type created'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'name' => 'required|string|unique:earning_types,name',
                'type' => 'required|string|in:daily,hourly,fixed'
            ]);

            $query = EarningType::findOrFail($id);

            $query->update($validated);

            return response()->json(['message' => 'Earnings Type updated'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        return EarningType::destroy($id);
    }

}
