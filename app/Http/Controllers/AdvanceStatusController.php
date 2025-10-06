<?php 

namespace App\Http\Controllers;

use App\Models\AdvanceStatus;
use Illuminate\Http\Request;

class AdvanceStatusController extends Controller
{
    public function index()
    {
        $query = AdvanceStatus::get();
        
        return response()->json([
            'data' => $query
        ]);
    }

}