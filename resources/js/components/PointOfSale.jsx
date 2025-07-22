import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import { Eye, Plus, X, FileText, LogOut } from "lucide-react";
import Swal from "sweetalert2";
import moment from "moment";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PointOfSale = () => {
  const [searchTerm, setSearchTerm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(0);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [priceOptions, setPriceOptions] = useState([]);
  const [modalPriceId, setModalPriceId] = useState(0);
  const [modalPrice, setModalPrice] = useState(0);
  const [modalCost, setModalCost] = useState(0);
  const [modalQty, setModalQty] = useState(1);
  const [modalDiscount, setModalDiscount] = useState(0);
  const [totalVat, setTotalVat] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [viewTransactionModal, setViewTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionDate, setTransactionDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const didFetch = useRef(false);
  const lastProductRef = useRef(null);
  const categories = [
    { id: 0, label: 'All' },
    { id: 1, label: 'Main' },
    { id: 2, label: 'Accessories' },
    { id: 3, label: 'Bolts and Screws' }
  ];
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

  const isFullyPaid = newSaleData.paymentOptions.reduce((sum, p) => sum + p.amount_paid, 0) >= totalAmount;    


  useEffect(() => {
    fetchFilteredProducts();
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    const totalCost = selectedProducts.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = selectedProducts.reduce((sum, item) => sum + item.discount, 0);
    const itemTotal = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
    const total = subtotal - discount;

    if (lastProductRef.current) {
      lastProductRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    setSubTotal(subtotal);
    setDiscountTotal(discount);
    setTotalAmount(total);
  }, [selectedProducts]);

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

  const handleSearch = async (e) => {
    const search = e.target.value;
    setSearchTerm(search);    
  }

  const fetchFilteredProducts = async () => {
    try {
        const authToken = localStorage.getItem("token");
        const response = await axios.get("/api/fetch-pos-products", {
            params: { search: searchTerm, category:categoryFilter },
            headers: { Authorization: `Bearer ${authToken}` },
        });
        setFilteredProducts(response.data);
    } catch (error) {
      setFilteredProducts([]);
    }
  }

  const handleSelectProduct = (productSelected) => {
    setModalProduct(productSelected);
    if (productSelected.pricing_list_available && productSelected.pricing_list_available.length > 0) {
      setPriceOptions(productSelected.pricing_list_available);
      const firstOption = productSelected.pricing_list_available[0];
      setModalPriceId(firstOption?.id || null);
      setModalPrice(firstOption?.price || 0.00);
      setModalCost(firstOption?.cost || 0.00);
      setModalDiscount(firstOption?.discount || 0);
    } else if (productSelected.pricing_list && productSelected.pricing_list.length > 0 && productSelected.track == "N") {
      setPriceOptions(productSelected.pricing_list);
      const firstOption = productSelected.pricing_list[0];
      setModalPriceId(firstOption?.id || null);
      setModalPrice(firstOption?.price || 0.00);
      setModalCost(firstOption?.cost || 0.00);
      setModalDiscount(firstOption?.discount || 0);
    } else {
      setModalPriceId(0);
      setModalPrice(0.00);
      setModalCost(0.00);
      setPriceOptions([]);
      setModalDiscount(0);
    }
    setModalQty(1);
    setShowModal(true);
  };


  const confirmAddProduct = () => {
    const qty = parseFloat(modalQty) || 0;
    const price = parseFloat(modalPrice) || 0;
    const discount = parseFloat(modalDiscount) || 0;
    const cost = parseFloat(modalCost) || 0;

    const newProduct = {
      ...modalProduct,
      id: modalProduct.id,
      name: modalProduct.name_variant,
      quantity: qty,
      price: price,
      discount: discount,
      amount: qty * price,
      cost: cost,
      totalCost: qty * cost
    };

    setSelectedProducts([...selectedProducts, newProduct]);

    setShowModal(false);
    setModalProduct(null);
  };

  const handlePriceChange = (e) => {
    const selectedPriceValue = parseFloat(e.target.value); 
    
    const selected = priceOptions.find(p => p.id === selectedPriceValue);
    
    if (selected) {
      setModalPriceId(selected.id);
      setModalPrice(selected.price); 
      setModalCost(selected.cost);
      setModalDiscount(selected.discount); 
    }
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
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
        Swal.fire("Voided!", `"${product.name}" has been voided.`, "success");
      }
    });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePayment = () => {
    // setShowPaymentModal(true);
    submitProceedToPayment();
  };

  const submitProceedToPayment = async () => {
    const updatedSaleData = { 
      ...newSaleData,
      products: selectedProducts
    };
    try {
        const authToken = localStorage.getItem("token");
        const response = await axios.post("/api/sales-proceed-payment", updatedSaleData, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 || response.status === 201) {
            toastr.success("Sale confirmed successfully!"); 

            Swal.fire(response.data.code, response.data.message, "success");

            setSelectedProducts([]);
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
          selectedProducts 
      };
      try {
          const authToken = localStorage.getItem("token");
          const response = await axios.post("/api/sales-confirm", updatedSaleData, {
              headers: { Authorization: `Bearer ${authToken}` },
          });
  
          if (response.status === 200 || response.status === 201) {
              toastr.success("Sale confirmed successfully!"); 
              setShowPaymentModal(false);
              setSelectedProducts([]);
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
  
  const handleTransactions = async () => {
    
    try {
        const authToken = localStorage.getItem("token");
        const response = await axios.get("/api/pos/transactions", {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        setViewTransactionModal(true);
        setTransactions(response.data.data);
        setTransactionDate(response.data.date);
    } catch (error) {
        toastr.error("Failed to view transactions. Please refresh the page.");
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',  // e.g., "Jun"
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1:
        return 'text-blue-600';
      case 2:
        return 'text-green-600';
      case 3:
        return 'text-orange-500';
      case 4:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full min-h-screen max-h-[90vh] flex flex-col">   
      <div className="flex justify-between items-center py-2 px-8 bg-white shadow-md border border-gray-200 rounded-lg">
        {/* Centered Logo and Title */}
        <div className="flex items-center gap-4">
          <img
            src="/images/clstldev2.png"
            alt="Logo 1"
            className="w-14 h-14 object-contain"
          />
          <img
            src="/images/rockfil.png"
            alt="Logo 2"
            className="w-14 h-14 object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Point of Sale <span className="text-gray-500 text-lg">(POS)</span>
            </h1>
          </div>
        </div>

        {/* Logout Button */}
        <Link
          to="/logout"
          className="flex items-center text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-all rounded-lg px-4 py-2 shadow-md hover:shadow-lg"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Link>
      </div>
      <div className="flex-1 w-full mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Product Catalog - spans 2 columns on larger screens */}
        <div className="md:col-span-2 h-full flex flex-col overflow-hidden">
          <div className="mb-4">
            <input 
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={handleSearch}
              className="border px-4 py-2 rounded w-full mb-2"
            />
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === cat.id ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-3 rounded-lg shadow-md">
                  <img src={product.img} alt={product.name} className="w-full h-32 object-contain mb-2" />
                  <h3 className="font-semibold text-sm">{product.name_variant}</h3>
                  <p className="text-xs text-gray-500">Code: {product.code}</p>
                  <p className="text-sm font-semibold text-blue-600">₱ {formatCurrency(product.price)}</p>
                  <p className="text-xs text-gray-400">Qty: {product.qty}</p>

                  {product.track==="N" || (product.qty > 0 && product.track!=="N")  ? (
                    <button
                      onClick={() => handleSelectProduct(product)}
                      className="mt-2 w-full bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  ) : (
                    <button
                      className="mt-2 w-full bg-gray-400 text-white text-sm py-1 rounded cursor-not-allowed"
                      disabled
                    >
                      Not Available
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Checkout */}
        <div className="md:col-span-1 h-full flex flex-col">
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full border border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Checkout</h2>

              <button
                onClick={handleTransactions}
                className="inline-flex items-center px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              >
                <FileText size={16} className="mr-2" />
                Transactions
              </button>
            </div>


            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedProducts.length > 0 ? (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {selectedProducts.map((product, idx) => (
                    <div
                      key={idx}
                      ref={idx === selectedProducts.length - 1 ? lastProductRef : null}
                      className="border-b-2 border-gray-200 pb-2 relative"
                    >
                      <button 
                        onClick={() => handleVoidProduct(product, idx)} 
                        className="absolute top-0 right-0 text-red-500 text-xs hover:underline"
                      >
                        Void
                      </button>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {product.quantity} × ₱ {formatCurrency(product.price)}</p>
                      <p className="text-xs text-gray-500">Disc: ₱ {formatCurrency(product.discount)}</p>
                      <p className="text-sm font-semibold text-right">
                        ₱ {formatCurrency(product.price * product.quantity - product.discount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No products selected.</p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-3 mt-3 text-sm">
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱ {formatCurrency(subTotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>Discount:</span>
                <span>₱ {formatCurrency(discountTotal)}</span>
              </p>
              <p className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₱ {formatCurrency(totalAmount)}</span>
              </p>
            </div>

            {/* Proceed Button */}
            <button 
              onClick={handlePayment}
              className={`mt-4 w-full py-2 rounded-md text-sm transition
                ${selectedProducts.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'}`}
              disabled={selectedProducts.length === 0}
            >
              Proceed to Payment
            </button>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Product</h2>
            <div className="text-sm mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-800 font-semibold">{modalProduct.name_variant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Code:</span>
                <span className="text-gray-800">{modalProduct.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Price:</span>
                <span className="text-gray-800">₱ {formatCurrency(modalProduct.price)}</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Quantity</label>
              {modalProduct.track == "N" && (
                  <input 
                      type="number"
                      value={modalPrice}
                      onChange={(e) => setPrice(e.target.value)}
                      className="border px-3 py-2 rounded-lg w-full"
                  />
              )}

              {modalProduct.track !== "N" && (
                <select 
                  value={modalPriceId}
                  onChange={handlePriceChange}
                  className="border px-3 py-2 rounded-lg w-full"
                >
                  {modalProduct.pricing_list_available.length > 0 && modalProduct.pricing_list_available.map((priceOption) => (
                    <option key={priceOption.id} 
                        value={priceOption.id} 
                          data-c={priceOption.cost}
                          data-d={priceOption.discount}>
                        {priceOption.supplier?.name}-{priceOption.cost} (Qty: {priceOption.qty} Price: {priceOption.price})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                value={modalQty}
                onChange={(e) => setModalQty(parseInt(e.target.value) || 1)}
                className="w-full border px-3 py-1 rounded mt-1"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Discount (₱)</label>
              <input
                type="number"
                min="0"
                value={modalDiscount}
                onChange={(e) => setModalDiscount(parseFloat(e.target.value) || 0)}
                className="w-full border px-3 py-1 rounded mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={confirmAddProduct}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[88vh] overflow-y-auto relative">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Payment</h2>
                    <button 
                      onClick={() => setShowPaymentModal(false)} 
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


      {viewTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg relative">
            <h2 className="text-xl font-semibold mb-6 text-center">Transactions - {transactionDate}</h2>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between items-center p-2 border-b bg-white rounded-lg shadow-sm"
                >
                  <div className="w-full text-left">
                    <p className="text-sm font-semibold">{index + 1}. {transaction.code}</p>
                    <p className="text-xs font-semibold text-blue-800">Total Amount: {Number(transaction.total_amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Date Time: {formatDateTime(transaction.date_time_of_sale)}
                    </p>
                    <p className={`text-xs font-semibold ${getStatusColor(transaction.status.id)}`}>
                      Status: {transaction.status.name}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowProductModal(true);
                      }}
                      className="mt-2 px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View Products
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setViewTransactionModal(false)}
              className="mt-2 w-full px-4 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showProductModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg relative">
            <h3 className="text-lg font-bold mb-4 text-center">
              Products in {selectedTransaction.code}
            </h3>
            <ul className="max-h-[60vh] overflow-y-auto space-y-2 text-sm">
              {selectedTransaction.products_list?.map((product, idx) => (
                <li key={idx} className="border-b pb-2">
                  <p><span className="font-semibold">Code:</span> {product.product_info?.code}</p>
                  <p><span className="font-semibold">Product:</span> {product.product_info?.name_variant}</p>
                  <p><span className="font-semibold">Quantity:</span> {product.qty}</p>
                  <p><span className="font-semibold">Price:</span> {Number(product.price).toFixed(2)}</p>
                  <p><span className="font-semibold">Discount:</span> {Number(product.discount_amount).toFixed(2)}</p>
                  <p><span className="font-semibold">Amount:</span> {Number(product.amount).toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowProductModal(false)}
              className="mt-4 w-full px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PointOfSale;
