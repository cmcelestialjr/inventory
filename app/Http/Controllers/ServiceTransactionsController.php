<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Service;
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

        if ($request->has('filterStatus')){
            $filter = $request->filterStatus;
            if($filter!='all'){
                $query->where('service_status_id', $filter);
            }
        }

        if ($request->has('filterPayment')){
            $filter = $request->filterPayment;
            if($filter!='all'){
                $query->where('payment_status_id', $filter);
            }
        }

        $transactions = $query->paginate(10);

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
        $validatedData = $request->validate([
            'serviceTransactionId' => 'nullable|integer|exists:service_transactions,id',
            'serviceId' => 'required|integer|exists:services,id',
            'serviceName' => 'required|string|max:255',
            'servicePrice' => 'required|numeric|min:0',
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
                'remarks' => $validatedData['remarks'],
                'updated_by' => $cashier_id,
                'created_by' => $cashier_id
            ]);

            $service_transaction_id = $serviceTransaction->id;

            $this->manageServiceTransactionProducts($validatedData, $service_transaction_id, $cashier_id, $validatedData['laborCost'], $amount);

            if($validatedData['paymentStatus']>1){
                $this->manageServiceTransactionPayments($validatedData, $service_transaction_id, $cashier_id, $amount);
            }

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
                'remarks' => $validatedData['remarks'],
                'updated_by' => $cashier_id,
            ]);

            $service_transaction_id = $serviceTransaction->id;

            $this->manageServiceTransactionProducts($validatedData, $service_transaction_id, $cashier_id, $validatedData['laborCost'], $amount);

            if($validatedData['paymentStatus']>1){
                $this->manageServiceTransactionPayments($validatedData, $service_transaction_id, $cashier_id, $amount);
            }

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
            ServiceTransactionProduct::updateOrCreate(
                [
                    'service_transaction_id' => $service_transaction_id,
                    'product_id' => $product['id'],
                ],
                [
                    'qty' => $product['qty'],
                    'cost' => $product['cost'],
                    'total' => $product['qty'] * $product['cost'],
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
            $totalAmount = ServiceTransactionPayment::where('service_transaction_id', $service_transaction_id)->sum('amount');

            ServiceTransaction::where('id', $service_transaction_id)->update([
                'paid' => $totalAmount,
                'remaining' => $amount-$totalAmount < 0 ? 0.0 : $amount-$totalAmount
            ]);
        }
    }
    public function removeProduct(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|integer|exists:service_transaction_products,id',
        ]);

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