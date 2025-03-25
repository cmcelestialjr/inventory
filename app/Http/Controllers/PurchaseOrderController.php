<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with('supplierInfo','statusInfo','products.productInfo');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                    ->orWhereHas('supplierInfo', function ($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($request->has('filter')) {
            $filter = $request->filter;
            if($filter!='All'){
                $query->where('status_id', $filter);
            }
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date_time_ordered', [$startDate, $endDate])
                        ->orWhereBetween('date_time_received', [$startDate, $endDate]);
                });
            }
        }

        $po = $query->paginate(5);

        return response()->json([
            'data' => $po->items(),
            'meta' => [
                'current_page' => $po->currentPage(),
                'last_page' => $po->lastPage(),
                'prev' => $po->previousPageUrl(),
                'next' => $po->nextPageUrl(),
            ]
        ]);
    }
}