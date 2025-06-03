<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PosController extends Controller
{
    public function transactions()
    {
        $user = Auth::user();
        $cashier_id = $user->id;

        $query = Sale::with('status','productsList.productInfo')->where('cashier_id',$cashier_id)
            ->whereDate('date_time_of_sale',date('Y-m-d'))
            ->get();        

        return response()->json([
            'data' => $query,
            'date' => date('F d, Y')
        ]);
    }

}