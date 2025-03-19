<?php
namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Sale;
use App\Models\SalesPayment;
use App\Models\SalesProduct;
use Auth;
class SaleServices
{
    public function insertSale($validatedData, $saleStatus)
    {
        $user = Auth::user();
        $cashier_name = $user->name;
        $cashier_id = $user->id;

        $code = $this->getCode();
        $customer_id = $this->getCustomerId($validatedData['customer_name']);

        $sale = Sale::create([
            'date_time_of_sale' => $validatedData['date_time_of_sale'],
            'customer_id' => $customer_id,
            'customer_name' => $validatedData['customer_name'],
            'code' => $code,
            'total_cost' => $validatedData['total_cost'],
            'total_price' => $validatedData['total_price'],
            'total_discount' => $validatedData['total_discount'],
            'total_qty' => $validatedData['total_qty'],
            'total_amount' => $validatedData['total_amount'],
            'amount_paid' => 0.00,
            'amount_change' => 0.00,
            'cashier_id' => $cashier_id,
            'sales_status_id' => $saleStatus,
            'cashier_name' => $cashier_name,
            'updated_by' => $cashier_id,
            'created_by' => $cashier_id
        ]);

        $sale_id = $sale->id;

        $this->paymentOptions($sale_id,$validatedData,$cashier_id);
        $this->products($sale,$validatedData,$cashier_id);

        return $sale;
    }

    public function updateSale($sale,$validatedData, $saleStatus)
    {
        $user = Auth::user();
        $cashier_name = $user->name;
        $cashier_id = $user->id;
        $customer_id = $this->getCustomerId($validatedData['customer_name']);

        $sale->update([
            'date_time_of_sale' => $validatedData['date_time_of_sale'],
            'customer_id' => $customer_id,
            'customer_name' => $validatedData['customer_name'],
            'total_cost' => $validatedData['total_cost'],
            'total_price' => $validatedData['total_price'],
            'total_discount' => $validatedData['total_discount'],
            'total_qty' => $validatedData['total_qty'],
            'total_amount' => $validatedData['total_amount'],
            'amount_paid' => 0.00,
            'amount_change' => 0.00,
            'cashier_id' => $cashier_id,
            'sales_status_id' => $saleStatus,
            'cashier_name' => $cashier_name,
            'updated_by' => $cashier_id,
        ]);

        $sale_id = $sale->id;

        $this->paymentOptions($sale_id,$validatedData,$cashier_id);

        $salesProducts = SalesProduct::where('sale_id',$sale->id)->get();
        if($salesProducts->count()>0){
            foreach($salesProducts as $salesProduct){
                $productPrice = ProductsPrice::where('product_id', $salesProduct->product_id)
                    ->where('price', $salesProduct->price)
                    ->where('cost', $salesProduct->cost)
                    ->first();

                if ($productPrice) {
                    $newQuantity = max(0, $productPrice->qty + $salesProduct->qty);

                    $productPrice->update(['qty' => $newQuantity]);
                }

                $totalStock = ProductsPrice::where('product_id', $salesProduct->product_id)->sum('qty');
                Product::where('id', $salesProduct->product_id)->update(['qty' => $totalStock]);
            }
        }

        $this->products($sale,$validatedData,$cashier_id);
    }

    private function paymentOptions($sale_id,$validatedData,$cashier_id)
    {
        if(isset($validatedData['paymentOptions'])){
            foreach ($validatedData['paymentOptions'] as $payment) {
                $amount_change = $payment['amount_change'] >= 0 ? $payment['amount_change'] : 0.00;
                $payment_status = $payment['payment_option_id']==4 ? 'Unpaid' : 'Paid';
                $total_amount = $payment['payment_option_id']==4 ? 0 : $payment['amount_paid']-$amount_change;
                SalesPayment::updateOrCreate(
                    [
                        'sale_id' => $sale_id,
                        'payment_option_id' => $payment['payment_option_id'],
                    ],
                    [
                        'payment_option_name' => $payment['payment_option_name'],
                        'amount' => $payment['amount'],
                        'amount_paid' => $payment['amount_paid'],
                        'amount_change' => $amount_change,
                        'total_amount' => $total_amount,
                        'payment_status' => $payment_status,
                        'updated_by' => $cashier_id,
                        'created_by' => $cashier_id,
                    ]
                );
            }
            $totalAmount = SalesPayment::where('sale_id', $sale_id)->sum('total_amount');
            Sale::where('id', $sale_id)->update(['total_amount' => $totalAmount]);
        }
    }

    private function products($sale,$validatedData,$cashier_id)
    {
        foreach ($validatedData['products'] as $product) {
            if($product['discount']>0){
                $discountPercentage = ($product['discount'] / $product['price']) * 100;

                $discountPercentage = round($discountPercentage);
            }else{
                $discountPercentage = 0.00;
            }

            SalesProduct::updateOrCreate(
                [
                    'sale_id' => $sale->id,
                    'product_id' => $product['id'],
                    'price' => $product['price'],
                    'qty' => $product['quantity'],
                    'amount' => $product['amount'],
                ],
                [
                    'sale_code' => $sale->code,
                    'total_cost' => $product['totalCost'],
                    'cost' => $product['cost'],
                    'discount_amount' => $product['discount'],
                    'discount_percentage' => $discountPercentage,
                    'updated_by' => $cashier_id,
                    'created_by' => $cashier_id,
                ]
            );

            $productPrice = ProductsPrice::where('product_id', $product['id'])
                ->where('price', $product['price'])
                ->where('cost', $product['cost'])
                ->first();

            if ($productPrice) {
                $newQuantity = max(0, $productPrice->qty - $product['quantity']);

                $productPrice->update(['qty' => $newQuantity]);
            }

            $totalStock = ProductsPrice::where('product_id', $product['id'])->sum('qty');
            Product::where('id', $product['id'])->update(['qty' => $totalStock]);
        }
    }

    private function getCode()
    {
        $today = now()->format('ymd');

        $lastSaleToday = Sale::where('code', 'LIKE', "INV-$today-%")->orderByDesc('code')->first();

        if ($lastSaleToday && preg_match('/INV-\d{6}-(\d+)/', $lastSaleToday->code, $matches)) {
            $newSaleNumber = intval($matches[1]) + 1;
        } else {
            $newSaleNumber = 1;
        }

        $saleCode = "INV-$today-" . str_pad($newSaleNumber, 5, '0', STR_PAD_LEFT);

        return $saleCode;
    }
    private function getCustomerId($customer_name)
    {
        $customer = Customer::firstOrCreate(['name' => $customer_name]);
        return $customer->id;
    }
}