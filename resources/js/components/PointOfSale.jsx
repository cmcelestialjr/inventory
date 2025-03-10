import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import { Eye, Plus, X, LogOut } from "lucide-react";
import Swal from "sweetalert2";
import moment from "moment";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PointOfSale = () => {
  const [searchProduct, setSearchProduct] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [showDropdownProducts, setShowDropdownProducts] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [price, setPrice] = useState(0.00);
  const [priceOptions, setPriceOptions] = useState([]);
  const [cost, setCost] = useState(0.00);
  const [totalCostProduct, setTotalCostProduct] = useState(0.00);
  const [amount, setAmount] = useState(0.00);
  const [discount, setDiscount] = useState(0.00);
  const [productId, setProductId] = useState(null);
  const [productName, setProductName] = useState(null);
  const [discountTotal, setDiscountTotal] = useState(0.00);
  const [subTotal, setSubTotal] = useState(0.00);
  const [totalAmount, setTotalAmount] = useState(0.00);
  const [proceedToPayment, setProceedToPayment] = useState(false);
  const didFetch = useRef(false);
  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [newSaleData, setNewSaleData] = useState({
    date_time_of_sale: getLocalDateTime(),
    code: "",
    cashier_name: "",
    customer_name: "Default",
    total_cost: 0.00,
    total_price: 0.00,
    total_qty: 0.00,
    total_discount: 0.00,
    total_amount: 0.00,
    paymentOptions: [{
      payment_option_id: 1,
      payment_option_name: "Cash",
      amount: 0.00,
      amount_paid: 0.00,
      amount_change: 0.00
    }]
  });
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState([]);

  const handleProductSearch = async (e) => {
    const search = e.target.value;
    setSearchProduct(search);
    if (search.length > 1) {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get("/api/fetch-products", {
                params: { search: search },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setProductOptions(response.data);
            setShowDropdownProducts(true);
        } catch (error) {
            // console.error("Error fetching products:", error);
        }
    } else {
        setProductOptions([]);
        setShowDropdownProducts(false);
    }
  };

  const handleSelectProduct = (productSelected) => {
    setSearchProduct(productSelected.name);
    setProductName(productSelected.name);
    setProductId(productSelected.id);
    setShowDropdownProducts(false);

    if (productSelected.pricing_list_available && productSelected.pricing_list_available.length > 0) {
        setPriceOptions(productSelected.pricing_list_available);
        const firstOption = productSelected.pricing_list_available[0];
        setSelectedPrice(firstOption?.id || null);
        setCost(firstOption?.cost || 0.00);
        setTotalCostProduct(firstOption?.cost || 0.00);
        setPrice(firstOption?.price || 0.00);
        setDiscount(firstOption?.discount || 0);
    } else {
        setSelectedPrice(null);
        setPriceOptions([]);
        setCost(0.00);
        setTotalCostProduct(0.00);
        setPrice(0.00);
        setDiscount(0);
    }
  };

  const handlePriceChange = (e) => {
    const selectedPriceValue = parseFloat(e.target.value); 

    const selected = priceOptions.find(p => p.id === selectedPriceValue);

    if (selected) {
        setSelectedPrice(selected.id);
        setPrice(selected.price); 
        setCost(selected.cost);
        setDiscount(selected.discount); 
    }
  };

  const handleAddProduct = () => {
    if(productId==null || productId==""){
        toastr.warning("No product selected!");
        return;
    } 

    const newProduct = {
        id: productId,
        name: productName,
        totalCost: totalCostProduct,
        cost: cost,
        price: price,
        discount: discount,
        quantity: quantity,
        amount: amount,
    };

    setProducts((prevProducts) => [newProduct, ...prevProducts]);


    setQuantity(1);
    setSearchProduct("");
    setProductName("");
    setProductId("");
    setSelectedPrice(null);
    setPriceOptions([]);
    setCost(0.00);
    setTotalCostProduct(0.00);
    setPrice(0.00);
    setDiscount(0);
  };

  const handleVoidProduct = (product, index) => {
    Swal.fire({
      title: `Delete ${product.name}?`,
      text: `Are you sure you want to void "${product.name}" priced at ${product.price}? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, void it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setProducts(products.filter((_, i) => i !== index));
        Swal.fire("Voided!", `"${product.name}" has been voided.`, "success");
      }
    });
  };  

  const handleCustomerSearch = async (e) => {
    const query = e.target.value;
    if(query!="Default"){
        setNewSaleData({ ...newSaleData, customer_name: query });
    
        if (query.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-customers", {
                    params: { search: query },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                setCustomerSuggestions(response.data.data);
                setShowSuggestions(true);
            } catch (error) {
                // console.error("Error fetching customers:", error);
            }
        } else {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
        }
    }
  };

  useEffect(() => {
    const total = parseFloat((Number(price) * Number(quantity) - Number(discount) * Number(quantity)).toFixed(2));
    const totalCostProducts = parseFloat((Number(cost) * Number(quantity)).toFixed(2));
    setAmount(total >= 0 ? total : 0);
    setTotalCostProduct(totalCostProducts >= 0 ? totalCostProducts : 0);
  }, [cost, price, discount, quantity]);

  useEffect(() => { 
    const newTotal = products.reduce((total, product) => total + Number(product.amount), 0).toFixed(2);
    const newCost = products.reduce((total, product) => total + Number(product.cost) * Number(product.quantity), 0).toFixed(2);
    const newPrice = products.reduce((total, product) => total + Number(product.price) * Number(product.quantity), 0).toFixed(2);
    const newDiscount = products.reduce((total, product) => total + Number(product.discount) * Number(product.quantity), 0).toFixed(2);
    setSubTotal(newPrice);  
    setDiscountTotal(newDiscount); 
    setTotalAmount(newTotal);
    setNewSaleData((prev) => ({ ...prev, total_amount: newTotal }));
    setNewSaleData((prev) => ({ ...prev, total_cost: newCost }));
    setNewSaleData((prev) => ({ ...prev, total_price: newPrice }));
    setNewSaleData((prev) => ({ ...prev, total_discount: newDiscount }));
  }, [products]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const authToken = localStorage.getItem("token");
    axios.get("/api/fetch-payment-options",{
            headers: { Authorization: `Bearer ${authToken}` },
        }) 
        .then(response => {
            if (response.data.success) {
                setAvailablePaymentOptions(response.data.data);
            } else {
                toastr.error("Failed to load payment options.");
            }
        })
        .catch(error => {
            toastr.error("Cant fetch payment options. Please refresh page.");
        });
  }, []);

  const handleProceedToPayment = () => {
    if(products.length <= 0){
      toastr.warning("No products to checkout.");
      return;
    }
    submitProceedToPayment();
    // setProceedToPayment(true);
  }

  const submitProceedToPayment = async () => {
    const updatedSaleData = { 
      ...newSaleData,
      products 
    };
    try {
        const authToken = localStorage.getItem("token");
        const response = await axios.post("/api/sales-proceed-payment", updatedSaleData, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 || response.status === 201) {
            toastr.success("Sale confirmed successfully!"); 

            Swal.fire(response.data.code, response.data.message, "success");

            setProceedToPayment(false);
            setProducts([]);
            setSelectedPrice(null);
            setPriceOptions([]);
            setTotalAmount(0.00);
            setSubTotal(0.00);  
            setDiscountTotal(0.00);
            setNewSaleData({
                date_time_of_sale: getLocalDateTime(),
                code: "",
                cashier_name: "",
                customer_name: "Default",
                total_cost: 0.00,
                total_price: 0.00,
                total_qty: 0.00,
                total_discount: 0.00,
                total_amount: 0.00,
                paymentOptions: [{
                    payment_option_id: 1,
                    payment_option_name: "Cash",
                    amount: 0.00,
                    amount_paid: 0.00,
                    amount_change: 0.00
                }]
            });
        } else {
            toastr.error("Unexpected response");
        }
    } catch (error) {
        // console.error("Request failed:", error.response?.data?.message || error.message);
        toastr.error("Failed to confirm sale.");
    }
  }

  const handlePaymentChange = (idx, field, id, value) => {
    let updatedPayments = [...newSaleData.paymentOptions];

    if (field === "payment_option_name") {
        updatedPayments[idx][field] = value;
        updatedPayments[idx]["payment_option_id"] = id; 
    } else {
        updatedPayments[idx][field] = parseFloat(value) || 0;
    }

    let remainingAmount = totalAmount;
    updatedPayments.forEach((payment, i) => {
        if (i === 0) {
            payment.amount = totalAmount;
        } else {
            payment.amount = remainingAmount;
        }
        payment.amount_change = payment.amount_paid - payment.amount;
        remainingAmount -= payment.amount_paid;
    });

    setNewSaleData({ ...newSaleData, paymentOptions: updatedPayments });
  };


  const addPaymentOption = () => {
    let totalPaid = newSaleData.paymentOptions.reduce((sum, p) => sum + p.amount_paid, 0);
    
    // Prevent adding a new option if totalPaid >= totalAmount
    if (totalPaid >= totalAmount) return;

    let remainingAmount = totalAmount - totalPaid;

    let updatedPayments = [...newSaleData.paymentOptions];
    updatedPayments.push({
        payment_option_id: 1,
        payment_option_name: "Cash",
        amount: remainingAmount > 0 ? remainingAmount : 0,
        amount_paid: 0.00,
        amount_change: 0.00
    });

    setNewSaleData({ ...newSaleData, paymentOptions: updatedPayments });
  };

  // Check if total amount is fully covered
  const isFullyPaid = newSaleData.paymentOptions.reduce((sum, p) => sum + p.amount_paid, 0) >= totalAmount;    

  const confirmNewSale = async () => {
    // Calculate the total paid amount
    const totalPaid = newSaleData.paymentOptions.reduce(
        (sum, option) => sum + (parseFloat(option.amount_paid) || 0),
        0
    );

    // Calculate the change
    const change = totalPaid - totalAmount;

    // Check if the change is negative (meaning not enough payment)
    if (change < 0) {
        toastr.warning("The total amount paid is insufficient. Please enter a valid payment.");
        return;
    }

    const updatedSaleData = { 
        ...newSaleData,
        products 
    };
    try {
        const authToken = localStorage.getItem("token");
        const response = await axios.post("/api/sales-confirm", updatedSaleData, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 || response.status === 201) {
            toastr.success("Sale confirmed successfully!"); 
            setProceedToPayment(false);
            setProducts([]);
            setSelectedPrice(null);
            setPriceOptions([]);
            setTotalAmount(0.00);
            setSubTotal(0.00);  
            setDiscountTotal(0.00);
            setNewSaleData({
                date_time_of_sale: getLocalDateTime(),
                code: "",
                cashier_name: "",
                customer_name: "Default",
                total_cost: 0.00,
                total_price: 0.00,
                total_qty: 0.00,
                total_discount: 0.00,
                total_amount: 0.00,
                paymentOptions: [{
                    payment_option_id: 1,
                    payment_option_name: "Cash",
                    amount: 0.00,
                    amount_paid: 0.00,
                    amount_change: 0.00
                }]
            });
        } else {
            toastr.error("Unexpected response");
        }
    } catch (error) {
        // console.error("Request failed:", error.response?.data?.message || error.message);
        toastr.error("Failed to confirm sale.");
    }
  };

  return (
    <div className="w-full">      
      <div className="w-full max-w-7xl mx-auto p-4 md:flex md:gap-6 mt-8 mb-10 px-10">
        {/* Right Section - Search & Add Product */}
        <div className="md:w-1/3 bg-white p-4 shadow-lg rounded-lg">
          <div className="relative mb-2">
            <label className="block text-sm font-medium text-gray-700">Product:</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search Product"
                value={searchProduct}
                onChange={handleProductSearch}
                className="border px-3 py-2 rounded-lg w-full"
              />
              {/* Dropdown */}
              {showDropdownProducts && productOptions.length > 0 && (
                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                  {productOptions.map((product) => (
                    <li 
                      key={product.id} 
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSelectProduct(product)}
                    >
                      {product.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Price, Discount, Quantity, Amount & Add Button */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Price:</label>
              <select 
                value={selectedPrice}
                onChange={handlePriceChange}
                className="border px-3 py-2 rounded-lg w-full"
              >
                {priceOptions.length > 0 && priceOptions.map((priceOption) => (
                  <option key={priceOption.id} 
                    value={priceOption.id} 
                    data-c={priceOption.cost}
                    data-d={priceOption.discount}>
                    {priceOption.price} (Qty: {priceOption.qty})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Qty:</label>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Disc:</label>
              <input 
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Amount:</label>
              <input 
                type="number"
                value={amount}
                className="border px-3 py-2 rounded-lg w-full"
                disabled
              />
            </div>
          </div>
          <div className="bg-white p-3 shadow-lg rounded-lg mt-1 text-sm">
            <button 
              onClick={handleAddProduct} 
              className="mt-3 w-full bg-blue-900 text-white p-2 rounded hover:bg-blue-700 text-sm">
              Add to Checkout
            </button>
          </div>

          {/* Summary Section */}
          <div className="bg-white p-3 shadow-lg rounded-lg mt-4 text-sm">
            <h2 className="text-md font-bold mb-2">Summary</h2>
            <div className="space-y-1">
              <p className="flex justify-between"><span>Subtotal:</span> <span>{subTotal}</span></p>
              <p className="flex justify-between"><span>Discount:</span> <span>{discountTotal}</span></p>
              <p className="flex justify-between font-semibold"><span>Total:</span> <span>{totalAmount}</span></p>
            </div>
            <button 
              onClick={handleProceedToPayment}
              className="mt-3 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 text-sm">
              Proceed to Payment
            </button>
          </div>
        </div>

        {/* Middle Section - Products */}
        <div className="md:w-2/3 bg-white p-4 shadow-lg rounded-lg mt-4 md:mt-0 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 flex gap-2">
              <img src="/images/clstldev2.png" alt="POS Logo" className="w-11 h-11" />
              <h1 className="text-2xl font-bold text-gray-800">POS</h1>
            </div>
            <Link 
              to="/logout"
              className="flex items-center p-2 rounded text-sm text-red-500 hover:bg-gray-100"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
          </div>
          <div className="space-y-2 flex-1 border p-2 rounded-md">
            {products.length > 0 ? (
              <div className="space-y-2">
                {/* Table Header - Visible only on larger screens */}
                <div className="hidden md:flex justify-between items-center bg-gray-200 p-2 font-semibold rounded">
                  <span className="w-1/12 text-sm text-center">#</span>
                  <span className="w-5/12 text-sm">Product</span>
                  <span className="w-2/12 text-sm text-right">Price</span>
                  <span className="w-1/12 text-sm text-right">Disc</span>
                  <span className="w-1/12 text-sm text-right">Qty</span>
                  <span className="w-2/12 text-sm text-right">Total</span>
                  <span className="w-1/12 text-sm text-right">Action</span>
                </div>

                {/* Products List */}
                <div className="max-h-[23rem] overflow-y-auto p-2">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row justify-between items-center p-2 border-b bg-white rounded-lg shadow-sm"
                    >
                      {/* Mobile View - Stack items */}
                      <div className="md:hidden w-full text-left">
                        <p className="text-sm font-semibold">{index + 1}. {product.name}</p>
                        <p className="text-xs text-gray-500">Cost: {product.cost} | Price: {product.price}</p>
                        <p className="text-xs text-gray-500">Disc: {product.discount} | Qty: {product.quantity}</p>
                        <p className="text-xs font-semibold text-right">Total: {Number(product.amount).toFixed(2)}</p>
                      </div>

                      {/* Desktop View - Table format */}
                      <span className="hidden md:inline-block w-1/12 text-sm text-center">{index + 1}</span>
                      <span className="hidden md:inline-block w-5/12 text-sm">{product.name}</span>
                      <span className="hidden md:inline-block w-2/12 text-sm text-right">{product.price}</span>
                      <span className="hidden md:inline-block w-1/12 text-sm text-right">{product.discount*product.quantity}</span>
                      <span className="hidden md:inline-block w-1/12 text-sm text-right">{product.quantity}</span>
                      <span className="hidden md:inline-block w-2/12 text-sm text-right font-semibold">
                        {Number(product.amount).toFixed(2)}
                      </span>

                      {/* Delete Button */}
                      <span className="w-full md:w-1/12 text-right mt-2 md:mt-0">
                        <button
                          onClick={() => handleVoidProduct(product, index)}
                          className="text-red-500 hover:text-red-700 p-1 bg-gray-100 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4 bg-white rounded-lg shadow-md">
                No products to checkout.
              </div>
            )}
          </div>
        </div>      
      </div>
      {proceedToPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payment</h2>
              <button 
                onClick={() => setProceedToPayment(false)} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Side - Form Inputs */}
              <div className="space-y-4">
                {/* Customer & Total */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-1">
                    <label className="block text-sm font-medium text-gray-700">Customer:</label>
                    <input 
                      type="text"
                      value={newSaleData.customer_name}
                      onChange={(e) => {
                        setNewSaleData({ ...newSaleData, customer_name: e.target.value });
                        handleCustomerSearch(e);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                    {/* Dropdown Suggestions */}
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-lg shadow-lg">
                        {customerSuggestions.map((customer) => (
                          <li
                            key={customer.name}
                            onClick={() => {
                              setNewSaleData({ ...newSaleData, customer_name: customer.name });
                              setShowSuggestions(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                          >
                            {customer.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <label className="block text-sm font-medium text-gray-700">Total Amount:</label>
                    <input 
                      type="number"
                      value={totalAmount}
                      className="w-full border px-3 py-2 rounded-lg bg-gray-100"
                      disabled
                    />
                  </div>
                </div>

                {/* Payment Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Options:</label>
                  <div className="space-y-2">
                    {newSaleData.paymentOptions.map((option, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-2 items-center">
                        {/* Payment Type Dropdown */}
                        <select
                          value={JSON.stringify({ id: option.payment_option_id, name: option.payment_option_name })}
                          onChange={(e) => {
                            const selectedValue = JSON.parse(e.target.value);
                            handlePaymentChange(idx, "payment_option_name", selectedValue.id, selectedValue.name);
                          }}
                          className="border px-3 py-2 rounded-lg flex-1"
                        >
                          {availablePaymentOptions.map((payment) => (
                            <option key={payment.id} value={JSON.stringify({ id: payment.id, name: payment.name })}>
                              {payment.name}
                            </option>
                          ))}
                        </select>

                        {/* Amount Paid */}
                        <input
                          type="number"
                          placeholder="Amount Paid"
                          value={option.amount_paid}
                          onChange={(e) => handlePaymentChange(idx, "amount_paid", e.target.value, e.target.value)}
                          className="border px-3 py-2 rounded-lg flex-1"
                        />

                        {/* Remove Button */}
                        {idx > 0 && (
                          <button 
                            onClick={() => {
                              let updatedPayments = newSaleData.paymentOptions.filter((_, i) => i !== idx);
                              setNewSaleData({ ...newSaleData, paymentOptions: updatedPayments });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Payment Option Button */}
                  <button 
                    onClick={addPaymentOption}
                    className={`mt-2 ${isFullyPaid ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
                    disabled={isFullyPaid}
                  >
                    + Add Payment Option
                  </button>
                </div>
              </div>

              {/* Right Side - Payment Summary */}
              <div className="border p-4 rounded-lg shadow-md bg-gray-100 text-center">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <p className="mb-2"><strong>Total Amount:</strong> {totalAmount}</p>
                <p className="text-blue-600 mb-2"><strong>Total Paid:</strong> {newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0).toFixed(2)}</p>
                <p className={`font-semibold ${totalAmount - newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <strong>Change:</strong> {(
                    newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) - totalAmount
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Confirm Button - Fixed at Bottom */}
            <div className="flex justify-end mt-4">
              <button onClick={confirmNewSale} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
