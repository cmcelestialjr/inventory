<?php

namespace App\Http\Controllers;

use App\Models\ServiceTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServiceTransactionsController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceTransaction::with('serviceInfo','customerInfo','paymentStatus','serviceStatus');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                ->where('service_name', 'LIKE', "%{$search}%")
                ->orWhere('customer_name', 'LIKE', "%{$search}%")
                ->orWhere('date_started', 'LIKE', "%{$search}%")
                ->orWhere('date_finished', 'LIKE', "%{$search}%")
                ->orWhere('day_out', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('filterStatus')){
            $filter = $request->filter;
            $query->where('service_status_id', $filter);
        }

        if ($request->has('filterPayment')){
            $filter = $request->filter;
            $query->where('payment_status_id', $filter);
        }

        $supplier = $query->paginate(10);

        return response()->json([
            'data' => $supplier->items(),
            'meta' => [
                'current_page' => $supplier->currentPage(),
                'last_page' => $supplier->lastPage(),
                'prev' => $supplier->previousPageUrl(),
                'next' => $supplier->nextPageUrl(),
            ]
        ]);
    }

    private function getCode()
    {
        $today = now()->format('ymd');

        $lastToday = ServiceTransaction::where('code', 'LIKE', "ST-$today-%")->orderByDesc('code')->first();

        $newNumber = $lastToday && preg_match('/ST-\d{6}-(\d+)/', $lastToday->code, $matches) ? intval($matches[1]) + 1 : 1;

        $code = "ST-$today-" . str_pad($newNumber, 5, '0', STR_PAD_LEFT);

        return $code;
    }
}