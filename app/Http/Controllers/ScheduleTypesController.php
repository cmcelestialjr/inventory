<?php 

namespace App\Http\Controllers;

use App\Models\SchedulePayType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ScheduleTypesController extends Controller
{
    public function index(Request $request)
    {
        
    }

    public function fetch()
    {
        $types = SchedulePayType::get();

        return response()->json($types);
    }

}
