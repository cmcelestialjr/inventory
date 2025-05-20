<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Service;
use App\Models\ServicesStatus;
use App\Models\ServiceTransaction;
use App\Models\ServiceTransactionPayment;
use App\Models\ServiceTransactionProduct;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServiceTransactionsController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceTransaction::with('serviceInfo','customerInfo','paymentStatus','serviceStatus','products.productInfo','payments');

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

        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            if ($startDate && $endDate) {
                $query->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date_started', [$startDate, $endDate])
                        ->orWhereBetween('date_finished', [$startDate, $endDate])
                        ->orWhereBetween('day_out', [$startDate, $endDate]);
                });
            }
        }

        if ($request->has('filterStatus')){
            $filter = $request->filterStatus;
            if($filter!='All'){
                $query->where('service_status_id', $filter);
            }
        }

        if ($request->has('filterPayment')){
            $filter = $request->filterPayment;
            if($filter!='All'){
                $query->where('payment_status_id', $filter);
            }
        }

        if ($request->has('sort_column') && $request->has('sort_order')) {
            $sortColumn = $request->sort_column;
            $sortOrder = $request->sort_order;
    
            if (in_array($sortColumn, ['code', 'service_name', 'customer_name', 'amount', 'total_cost', 'income', 'service_status_id', 'payment_status_id', 'remarks'])) {
                $query->orderBy($sortColumn, $sortOrder);
            }
        }

        $transactions = $query->orderBy('created_at','DESC')->paginate(5);

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'prev' => $transactions->previousPageUrl(),
                'next' => $transactions->nextPageUrl(),
            ]
        ]);
    }
    public function manage(Request $request)
    {
        return $request->serviceTransactionId==null ? $this->store($request) : $this->edit($request);
    }
    private function store($request)
    {
        // dd($request);
        $validatedData = $request->validate([
            'serviceTransactionId' => 'nullable|integer|exists:service_transactions,id',
            'serviceId' => 'required|integer|exists:services,id',
            'serviceName' => 'required|string|max:255',
            'servicePrice' => 'required|numeric|min:0',
            'serviceStartDate' => 'required|date',
            'laborCost' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'remarks' => 'nullable|string|max:255',
            'productsSelected' => 'nullable|array',
            'productsSelected.*.id' => 'integer|exists:products,id',
            'productsSelected.*.name' => 'string|max:255',
            'productsSelected.*.cost' => 'numeric|min:0',
            'productsSelected.*.qty' => 'numeric|min:0',
            'productsSelected.*.total' => 'numeric|min:0',
            'customerId' => 'nullable|integer|exists:customers,id',
            'customerName' => 'required|string|max:255',
            'customerContactNo' => 'nullable|string|max:15',
            'customerEmail' => 'nullable|email|max:255',
            'customerAddress' => 'nullable|string|max:500',
            'paymentStatus' => 'required|integer|exists:payment_options,id',
            'paymentOptions' => 'nullable|array',            
            'paymentOptions.*.transaction_payment_id' => 'nullable|integer|exists:service_transaction_payments,id',
            'paymentOptions.*.payment_option_id' => 'integer|exists:payment_options,id',
            'paymentOptions.*.payment_option_name' => 'string|max:255',
            'paymentOptions.*.amount_paid' => 'numeric|min:0',
            'paymentOptions.*.date' => 'date',
        ]);

        $service = Service::findOrFail($validatedData['serviceId']);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            $code = $this->getCode();
            $customer_id = $validatedData['customerId'];
            if($customer_id==null){
                $customer_id = $this->getCustomer($validatedData['customerName'],$validatedData['customerContactNo'],$validatedData['customerEmail'],$validatedData['customerAddress'],$cashier_id);
            }
            $amount = $validatedData['servicePrice']-$validatedData['discount'];
            $serviceTransaction = ServiceTransaction::create([
                'code' => $code,
                'service_id' => $validatedData['serviceId'],
                'service_name' => $validatedData['serviceName'],
                'customer_id' => $customer_id,
                'customer_name' => $validatedData['customerName'],
                'service_status_id' => 1,
                'payment_status_id' => $validatedData['paymentStatus'],
                'price' => $validatedData['servicePrice'],
                'labor_cost' => $validatedData['laborCost'],
                'discount' => $validatedData['discount'],
                'amount' => $amount,
                'date_started' => date('Y-m-d',strtotime($validatedData['serviceStartDate'])),
                'remarks' => $validatedData['remarks'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            $service_transaction_id = $serviceTransaction->id;

            $this->manageServiceTransactionProducts($validatedData, $service_transaction_id, $cashier_id, $validatedData['laborCost'], $amount);

            if($validatedData['paymentStatus']>1){
                $this->manageServiceTransactionPayments($validatedData, $service_transaction_id, $cashier_id, $amount);
            }

            $totalAmount = ServiceTransactionPayment::where('service_transaction_id', $service_transaction_id)->sum('amount');

            ServiceTransaction::where('id', $service_transaction_id)->update([
                'paid' => $totalAmount,
                'remaining' => $amount-$totalAmount < 0 ? 0.0 : $amount-$totalAmount
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! New service transaction saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    private function edit($request)
    {
        $validatedData = $request->validate([
            'serviceTransactionId' => 'required|integer|exists:service_transactions,id',
            'serviceId' => 'required|integer|exists:services,id',
            'serviceName' => 'required|string|max:255',
            'servicePrice' => 'required|numeric|min:0',
            'serviceStartDate' => 'required|date',
            'laborCost' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'remarks' => 'nullable|string|max:255',
            'productsSelected' => 'required|array',
            'productsSelected.*.id' => 'integer|exists:products,id',
            'productsSelected.*.name' => 'required|string|max:255',
            'productsSelected.*.cost' => 'required|numeric|min:0',
            'productsSelected.*.qty' => 'required|numeric|min:0',
            'productsSelected.*.total' => 'required|numeric|min:0',
            'customerId' => 'nullable|integer|exists:customers,id',
            'customerName' => 'required|string|max:255',
            'customerContactNo' => 'nullable|string|max:15',
            'customerEmail' => 'nullable|email|max:255',
            'customerAddress' => 'nullable|string|max:500',
            'paymentStatus' => 'required|integer|exists:payment_options,id',
            'paymentOptions' => 'nullable|array',
            'paymentOptions.*.transaction_payment_id' => 'nullable|integer|exists:service_transaction_payments,id',
            'paymentOptions.*.payment_option_id' => 'integer|exists:payment_options,id',
            'paymentOptions.*.payment_option_name' => 'string|max:255',
            'paymentOptions.*.amount_paid' => 'numeric|min:0',
            'paymentOptions.*.date' => 'date',
        ]);

        $serviceTransaction = ServiceTransaction::findOrFail($validatedData['serviceTransactionId']);
        $service = Service::findOrFail($validatedData['serviceId']);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            $customer_id = $validatedData['customerId'];
            if($customer_id==null){
                $customer_id = $this->getCustomer($validatedData['customerName'],$validatedData['customerContactNo'],$validatedData['customerEmail'],$validatedData['customerAddress'],$cashier_id);
            }
            $amount = $validatedData['servicePrice']-$validatedData['discount'];
            $serviceTransaction->update([
                'service_id' => $validatedData['serviceId'],
                'service_name' => $validatedData['serviceName'],
                'customer_id' => $validatedData['customerId'],
                'customer_name' => $validatedData['customerName'],
                'service_status_id' => 1,
                'payment_status_id' => $validatedData['paymentStatus'],
                'price' => $validatedData['servicePrice'],
                'labor_cost' => $validatedData['laborCost'],                
                'discount' => $validatedData['discount'],
                'amount' => $amount,
                'date_started' => date('Y-m-d',strtotime($validatedData['serviceStartDate'])),
                'remarks' => $validatedData['remarks'],
                'updated_by' => $cashier_id,
            ]);

            $service_transaction_id = $serviceTransaction->id;

            $this->manageServiceTransactionProducts($validatedData, $service_transaction_id, $cashier_id, $validatedData['laborCost'], $amount);

            if($validatedData['paymentStatus']>1){
                $this->manageServiceTransactionPayments($validatedData, $service_transaction_id, $cashier_id, $amount);
            }

            $totalAmount = ServiceTransactionPayment::where('service_transaction_id', $service_transaction_id)->sum('amount');

            ServiceTransaction::where('id', $service_transaction_id)->update([
                'paid' => $totalAmount,
                'remaining' => $amount-$totalAmount < 0 ? 0.0 : $amount-$totalAmount
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! Updated service transaction saved..'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    private function manageServiceTransactionProducts($validatedData, $service_transaction_id, $cashier_id, $laborCost, $amount)
    {
        foreach ($validatedData['productsSelected'] as $product) {
            $product_id = $product['id'];
            $cost = $product['cost'];
            $qty = $product['qty'];

            $this->updateProduct($service_transaction_id, $product_id, $qty, $cost, 'update');            

            ServiceTransactionProduct::updateOrCreate(
                [
                    'service_transaction_id' => $service_transaction_id,
                    'product_id' => $product_id
                ],
                [
                    'qty' => $qty,
                    'cost' => $cost,
                    'total' => $qty * $cost,
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id,
                ]
            );

            
        }
        $totalAmount = ServiceTransactionProduct::where('service_transaction_id', $service_transaction_id)->sum('total');
        ServiceTransaction::where('id', $service_transaction_id)->update([
            'product_cost' => $totalAmount,
            'total_cost' => $laborCost+$totalAmount,
            'income' => $amount-$laborCost+$totalAmount
        ]);
    }
    private function updateProduct($service_transaction_id, $product_id, $qty, $cost, $type)
    {
        $checkProduct = ServiceTransactionProduct::where('service_transaction_id',$service_transaction_id)
                ->where('product_id',$product_id)
                ->first();
        
        if($checkProduct){            
            $qtyOld = $checkProduct->qty;            
        }else{
            $qtyOld = 0;
        }
        
        if($qty<$qtyOld || $qty>$qtyOld || $type=='remove' || $type=='add'){
            
            $productPrice = ProductsPrice::where('product_id', $product_id)
                ->orderBy('restock_date', 'DESC')
                ->first();
            
            if ($productPrice) {
                if($type=='remove'){
                    $qtyDiff = $qty;
                    $newQuantity = max(0, $productPrice->qty + $qtyDiff);
                }elseif($type=='add'){
                    $qtyDiff = $qty;
                    $newQuantity = max(0, $productPrice->qty - $qtyDiff);
                }else{
                    if($qty<$qtyOld){
                        $qtyDiff = $qtyOld-$qty;
                        $newQuantity = max(0, $productPrice->qty + $qtyDiff);
                    }else{
                        $qtyDiff = $qty-$qtyOld;
                        $newQuantity = max(0, $productPrice->qty - $qtyDiff);
                    }
                }
                $productPrice->update(['qty' => $newQuantity]);
            }
                
            $totalStock = ProductsPrice::where('product_id', $product_id)->sum('qty');
            Product::where('id', $product_id)->update(['qty' => $totalStock]);
        }
    }
    private function manageServiceTransactionPayments($validatedData, $service_transaction_id, $cashier_id, $amount)
    {
        if(isset($validatedData['paymentOptions'])){
            foreach ($validatedData['paymentOptions'] as $payment) {
                if($payment['transaction_payment_id']){
                    ServiceTransactionPayment::where('id', $payment['transaction_payment_id'])->update([
                        'payment_date' => date('Y-m-d H:i:s',strtotime($payment['date'])),
                        'amount' => $payment['amount_paid'],
                        'updated_by' => $cashier_id,
                    ]);
                }else{
                    ServiceTransactionPayment::updateOrCreate(
                        [
                            'service_transaction_id' => $service_transaction_id,
                            'payment_option_id' => $payment['payment_option_id'],
                            'payment_date' => date('Y-m-d H:i:s',strtotime($payment['date'])),
                        ],
                        [
                            'payment_option_name' => $payment['payment_option_name'],
                            'amount' => $payment['amount_paid'],
                            'updated_by' => $cashier_id,
                            'created_by' => $cashier_id,
                        ]
                    );
                }
            }
        }
    }
    public function payment(Request $request)
    {
        $validatedData = $request->validate([
            'serviceTransactionId' => 'required|integer|exists:service_transactions,id',
            'payment.id' => 'integer|exists:service_transaction_payments,id',
            'payment.payment_option_id' => 'integer|exists:payment_options,id',
            'payment.payment_option_name' => 'string|max:255',
            'payment.amount' => 'numeric|min:0',
            'payment.payment_date' => 'date',
        ]);

        $service_transaction_id = $validatedData['serviceTransactionId'];
        
        $serviceTransaction = ServiceTransaction::findOrFail($service_transaction_id);
        $amount = $serviceTransaction->amount;

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;
            
            if(isset($validatedData['payment']['id'])){
                $payment = ServiceTransactionPayment::findOrFail($validatedData['payment']['id']);
                
            }else{
                $payment = new ServiceTransactionPayment;
                $payment->service_transaction_id = $service_transaction_id;
                $payment->created_by = $cashier_id;
            }

            $payment->payment_option_id = $validatedData['payment']['payment_option_id'];
            $payment->payment_option_name = $validatedData['payment']['payment_option_name'];
            $payment->amount = $validatedData['payment']['amount'];
            $payment->payment_date = date('Y-m-d H:i:s',strtotime($validatedData['payment']['payment_date']));
            $payment->updated_by = $cashier_id;
            $payment->save();

            $totalAmount = ServiceTransactionPayment::where('service_transaction_id', $service_transaction_id)->sum('amount');
            $remaining = $amount-$totalAmount < 0 ? 0.0 : $amount-$totalAmount;
            if($remaining==0){
                $payment_status_id = 3;
            }elseif($remaining>0 && $totalAmount>0){
                $payment_status_id = 2;
            }else{
                $payment_status_id = 1;
            }

            ServiceTransaction::where('id', $service_transaction_id)->update([
                'paid' => $totalAmount,
                'remaining' => $amount-$totalAmount < 0 ? 0.0 : $amount-$totalAmount,
                'payment_status_id' => $payment_status_id
            ]);

            DB::commit();
            return response()->json(['message' => 'Successful! Updated payment transaction saved..',
                'data' => ServiceTransaction::with('paymentStatus','payments')->where('id',$service_transaction_id)->first()
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
    public function removeProduct(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:service_transaction_products,id',
        ]);

        $service_transaction_id = $validatedData['id'];

        $query = ServiceTransactionProduct::where('id', $service_transaction_id)->first();

        $this->updateProduct($service_transaction_id, $query->product_id, $query->qty, $query->cost, 'remove');   
        
        $deleted = ServiceTransactionProduct::where('id', $validatedData['id'])->delete();

        if ($deleted) {
            return response()->json(['message' => 'Product deleted successfully.'], 200);
        } else {
            return response()->json(['message' => 'Product not found.'], 404);
        }
    }
    public function removePayment(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:service_transaction_payments,id',
        ]);

        $deleted = ServiceTransactionPayment::where('id', $validatedData['id'])->delete();

        if ($deleted) {
            return response()->json(['message' => 'Payment deleted successfully.'], 200);
        } else {
            return response()->json(['message' => 'Payment not found.'], 404);
        }
    }
    public function serviceStatuses(Request $request)
    {
        try {
            $paymentOptions = ServicesStatus::select('id', 'name')->orderBy('id','ASC')->get();

            return response()->json([
                'success' => true,
                'data' => $paymentOptions
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment statuses',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function statusSave(Request $request)
    {
        $validatedData = $request->validate([
            'serviceTransactionId' => 'required|integer|exists:service_transactions,id',
            'serviceStatus' => 'required|integer|exists:services_statuses,id',
            'serviceStartDate' => 'required|date',
            'serviceDateFinished' => 'nullable|date',
            'serviceDateOut' => 'nullable|date',
        ]);

        $user = Auth::user();
        $cashier_id = $user->id;

        $service_transaction_id = $validatedData['serviceTransactionId'];

        $day_out = strtotime($validatedData['serviceDateOut']) ? date('Y-m-d', strtotime($validatedData['serviceDateOut'])) : null;
        $date_finished = strtotime($validatedData['serviceDateFinished']) ? date('Y-m-d', strtotime($validatedData['serviceDateFinished'])) : null;
        $service_status_id = $validatedData['serviceStatus'];
        if($day_out){
            $service_status_id = 2;
        }
        $query = ServiceTransaction::findOrFail($service_transaction_id);
        $service_status_id_old = $query->service_status_id;
        $query->service_status_id = $service_status_id;
        $query->date_started = date('Y-m-d', strtotime($validatedData['serviceStartDate']));
        $query->date_finished = $date_finished;
        $query->day_out = $day_out;
        $query->updated_by = $cashier_id;
        $query->save();

        $products = ServiceTransactionProduct::where('service_transaction_id',$service_transaction_id)->get();
        $this->manageServiceTransactionProductsCancelReturn($products, $service_transaction_id, $service_status_id, $service_status_id_old);

        return response()->json([
            'message' => 'Successful! Updated service status saved..',
        ], 200);
    }
    private function manageServiceTransactionProductsCancelReturn($products, $service_transaction_id, $service_status_id, $service_status_id_old)
    {
        if($products->count()>0){
            foreach ($products as $product) {
                $product_id = $product->product_id;
                $cost = $product->cost;
                $qty = $product->qty;

                if(($service_status_id==3 || $service_status_id==5) && ($service_status_id_old!=3 && $service_status_id_old!=5)){
                    $this->updateProduct($service_transaction_id, $product_id, $qty, $cost, 'remove');
                }elseif(($service_status_id!=3 && $service_status_id!=5) && ($service_status_id_old==3 || $service_status_id_old==5)){
                    $this->updateProduct($service_transaction_id, $product_id, $qty, $cost, 'add');
                }
                
            }
        }
    }
    public function serviceStatusCount(Request $request)
    {
        try {
            $query = ServiceTransaction::selectRaw("
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN service_status_id = 1 THEN 1 ELSE 0 END), 0) as ongoing,
                COALESCE(SUM(CASE WHEN service_status_id = 2 THEN 1 ELSE 0 END), 0) as done,
                COALESCE(SUM(CASE WHEN service_status_id = 3 THEN 1 ELSE 0 END), 0) as cancelled,
                COALESCE(SUM(CASE WHEN service_status_id = 5 THEN 1 ELSE 0 END), 0) as returned,
                COALESCE(SUM(CASE WHEN service_status_id = 4 THEN 1 ELSE 0 END), 0) as onhold,
                COALESCE(SUM(CASE WHEN payment_status_id = 1 THEN 1 ELSE 0 END), 0) as none,
                COALESCE(SUM(CASE WHEN payment_status_id = 2 THEN 1 ELSE 0 END), 0) as partial,
                COALESCE(SUM(CASE WHEN payment_status_id = 3 THEN 1 ELSE 0 END), 0) as fully
            ")
            ->when($request->has('search') && !empty($request->search), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'LIKE', "%{$search}%")
                    ->where('service_name', 'LIKE', "%{$search}%")
                    ->orWhere('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('date_started', 'LIKE', "%{$search}%")
                    ->orWhere('date_finished', 'LIKE', "%{$search}%")
                    ->orWhere('day_out', 'LIKE', "%{$search}%");
                });
            })
            ->when($request->has('start_date') && $request->has('end_date'), function ($query) use ($request) {
                $startDate = $request->start_date;
                $endDate = $request->end_date;
    
                if ($startDate && $endDate) {
                    $query->where(function ($q) use ($startDate, $endDate) {
                        $q->whereBetween('date_started', [$startDate, $endDate])
                            ->orWhereBetween('date_finished', [$startDate, $endDate])
                            ->orWhereBetween('day_out', [$startDate, $endDate]);
                    });
                }
            });

            $summary = $query->first();

            return response()->json([
                'success' => true,
                'data' => $summary
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service statuses count..',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function returned(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:service_transaction_products,id',
            'returned' => 'required|numeric|min:0.00',
        ]);

        try{
            DB::beginTransaction();

            $user = Auth::user();
            $cashier_id = $user->id;

            $query = ServiceTransactionProduct::findOrFail($validatedData['id']);

            $returned_old = $query->qty_returned;
            $returned = $validatedData['returned'];

            if($returned>$returned_old){
                $qty = $query->qty - $validatedData['returned'];                
            }else{
                $qty_add = $returned_old-$returned;
                $qty = $query->qty + $qty_add;
            }
            
            $total = $query->cost * $qty;
            
            $query->qty = $qty;
            $query->total = $total;
            $query->qty_returned = $returned;
            $query->updated_by = $cashier_id;
            $query->save();

            if($returned>$returned_old){
                $qty_add = $returned-$returned_old;
                $this->updateProduct($query->service_transaction_id, $query->product_id, $qty_add, $query->cost, 'add'); 
            }elseif($returned<$returned_old){
                $qty_remove = $returned_old-$returned;
                $this->updateProduct($query->service_transaction_id, $query->product_id, $qty_remove, $query->cost, 'remove'); 
            }

            DB::commit();
            return response()->json([
                'qty' => $qty,
                'total' => $total,
                'message' => 'Successful! Updated returned product..',
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
    private function getCustomer($name,$contactNo,$email,$address,$cashier_id)
    {
        $customer = Customer::where('name',$name)->first();
        if(!$customer){
            $customer = Customer::create([
                'customer_type_id' => 1,
                'name' => $name,
                'contact_no' => $contactNo,
                'email' => $email,
                'address' => $address,
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);
        }

        return $customer->id;
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