import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X } from "lucide-react";
import toastr from 'toastr';

const ReturnsNewModal = ({ isOpen, onClose, refreshReturns }) => {
    if (!isOpen) return null;

    const [searchSales, setSearchSales] = useState(null);
    const [salesId, setSalesId] = useState(null);
    const [salesCode, setSalesCode] = useState("");
    const [refundOptionId, setRefundOptionId] = useState(null);
    const [remarks, setRemarks] = useState(null);
    const [salesOptions, setSalesOptions] = useState([]);
    const [showDropdownSales, setShowDropdownSales] = useState(false);
    const [salesProducts, setSalesProducts] = useState([]);
    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [returnProducts, setReturnProducts] = useState([]);
    const [qty, setQty] = useState(1);
    const [refundAmount, setRefundAmount] = useState(0.00);
    const [searchProduct, setSearchProduct] = useState(null);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);
    const [dropDownProducts, setDropDownProducts] = useState([]);
    const [selectedPrice, setSelectedPrice] = useState(null);
    const [selectedReturnOption, setSelectedReturnOption] = useState(null);
    const [returnOptions, setReturnOptions] = useState([]);
    const [priceOptions, setPriceOptions] = useState([]);
    const [changedQty, setChangedQty] = useState(1);
    const [changedProducts, setChangedProducts] = useState([]);
    const [changedPrice, setChangedPrice] = useState(0.00);
    const [changedCost, setChangedCost] = useState(0.00);
    const [changedTotalCost, setChangedTotalCost] = useState(0.00);
    const [changedDiscount, setChangedDiscount] = useState(0.00);
    const [changedAmount, setChangedAmount] = useState(0.00);
    const [changedProductId, setChangedProductId] = useState(null);
    const [changedProductName, setChangedProductName] = useState(null);
    const [changedTotalAmount, setChangedTotalAmount] = useState(0.00);
    const [returnTotalAmount, setReturnTotalAmount] = useState(0.00);
    const [totalAmount, setTotalAmount] = useState(0.00);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);

    const toggleAddPayment = () => {
        if (Number(changedTotalAmount) + Number(refundAmount) > Number(returnTotalAmount)) {
            setShowAddPayment(!showAddPayment);
        }
    };

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
    
    useEffect(() => {
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

    useEffect(() => {
        const authToken = localStorage.getItem("token");
        axios.get("/api/fetch-return-options",{
                headers: { Authorization: `Bearer ${authToken}` },
            }) 
            .then(response => {
                if (response.data.success) {
                    const options = response.data.data;
                    setReturnOptions(options);

                    if (options.length > 0) {
                        setRefundOptionId(options[0].id);
                    }
                } else {
                    toastr.error("Failed to load return options.");
                }
            })
            .catch(error => {
                toastr.error("Cant fetch return options. Please refresh page.");
            });
    }, []);


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

    const confirmNewReturn = async () => {
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
            refund_amount: refundAmount,
            sales_id: salesId,
            sales_code: salesCode,
            return_option_id: refundOptionId,
            remarks: remarks,
            changedTotalAmount: changedTotalAmount,
            returnTotalAmount: returnTotalAmount,
            returnProducts,
            changedProducts,
        };
        toastr.success("Confirming return..."); 
        console.error(updatedSaleData);
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.post("/api/returns-confirm", updatedSaleData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message); 
                setSalesId(null);
                setSalesCode("");
                setRefundOptionId(null);
                setRemarks(null);
                setChangedProducts([]);
                setReturnProducts([]);
                setSelectedPrice(null);
                setPriceOptions([]);
                setTotalAmount(0.00);
                setStep(1);

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
                refreshReturns(1);
                onClose();
            } else {
                toastr.error("Unexpected response");
            }
        } catch (error) {
            // console.error("Request failed:", error.response?.data?.message || error.message);
            toastr.error("Failed to confirm return.");
        }
    };

    const handleSalesSearch = async (e) => {
        const search = e.target.value;
        setSearchSales(search);
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-sales", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setSalesOptions(response.data);
                setShowDropdownSales(true);
            } catch (error) {
                // console.error("Error fetching sales:", error);
            }
        } else {
            setSalesOptions([]);
            setShowDropdownSales(false);
        }
    };    

    const handleSelectSales = (salesSelected) => {
        setSearchSales(`Code: ${salesSelected.code} - Total Amount: ${salesSelected.total_amount}`);
        setSalesId(salesSelected.id);
        setSalesCode(salesSelected.code);

        setShowDropdownSales(false);
        setSalesProducts(salesSelected.products_list);
    };  
    
    const handleSelectedSubmit = () => {
        if (selectedProduct) {
            const updatedProduct = {
                ...selectedProduct,
                qty: qty,
                amount: (selectedProduct.price * qty) - (qty * selectedProduct.discount_amount),
            };

            setReturnProducts([...returnProducts, updatedProduct]);
            setSelectedProduct(null);
        }
    };

    const handleRemoveProduct = (index) => {
        setReturnProducts(returnProducts.filter((_, i) => i !== index));
    };
    const handleChangedRemoveProduct = (index) => {
        setChangedProducts(changedProducts.filter((_, i) => i !== index));
    };
    
    const handleProductClick = (product) => {
        setSelectedProduct(product);
    };

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
                setDropDownProducts(response.data);
                setShowDropdownProducts(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setDropDownProducts([]);
            setShowDropdownProducts(false);
        }
    };

    const handleSelectProduct = (productSelected) => {
        setSearchProduct(productSelected.name);
        setChangedProductName(productSelected.name);
        setChangedProductId(productSelected.id);
        setShowDropdownProducts(false);

        if (productSelected.pricing_list_available && productSelected.pricing_list_available.length > 0) {
            setPriceOptions(productSelected.pricing_list_available);
            const firstOption = productSelected.pricing_list_available[0];
            setSelectedPrice(firstOption?.id || null);
            setChangedCost(firstOption?.cost || 0.00);
            setChangedTotalCost(firstOption?.cost || 0.00);
            setChangedPrice(firstOption?.price || 0.00);
            setChangedDiscount(firstOption?.discount || 0);
        } else {
            setSelectedPrice(null);
            setPriceOptions([]);
            setChangedCost(0.00);
            setChangedTotalCost(0.00);
            setChangedPrice(0.00);
            setChangedDiscount(0);
        }
    };

    const handlePriceChange = (e) => {
        const selectedPriceValue = parseFloat(e.target.value); 
    
        const selected = priceOptions.find(p => p.id === selectedPriceValue);
    
        if (selected) {
            setSelectedPrice(selected.id);
            setChangedPrice(selected.price); 
            setChangedCost(selected.cost);
            setChangedDiscount(selected.discount); 
        }
    };

    const handleAddProductChange = () => {
        if(changedProductId==null){
            toastr.warning("No product selected!");
            return;
        } 

        const newProduct = {
            id: changedProductId,
            name: changedProductName,
            totalCost: changedTotalCost,
            cost: changedCost,
            price: changedPrice,
            discount: changedDiscount,
            quantity: changedQty,
            amount: changedAmount,
        };
    
        setChangedProducts((prevProducts) => [...prevProducts, newProduct]);
        setChangedProductName(null);
        setChangedProductId(null);
        setSearchProduct("");
        setPriceOptions([]);
        setSelectedPrice(null);
        setChangedDiscount(0.00);
        setChangedQty(1);
        setChangedPrice(0.00);
        setChangedCost(0.00);
    };

    useEffect(() => {
        const total = parseFloat((Number(changedPrice) * Number(changedQty) - Number(changedDiscount) * Number(changedQty)).toFixed(2));
        const totalCostProducts = parseFloat((Number(changedCost) * Number(changedQty)).toFixed(2));
        setChangedAmount(total >= 0 ? total : 0);
        setChangedTotalCost(totalCostProducts >= 0 ? totalCostProducts : 0);
    }, [changedCost, changedPrice, changedDiscount, changedQty]);

    useEffect(() => {
        
        const getReturnTotalAmount = returnProducts.reduce((total, product) => total + Number(product.amount), 0).toFixed(2);
        const getChangeTotalAmount = changedProducts.reduce((total, product) => total + Number(product.amount), 0).toFixed(2);
        const getRefundAmount = getReturnTotalAmount-getChangeTotalAmount <= 0 ? 0 : getReturnTotalAmount-getChangeTotalAmount;
        const newTotal = Number(getChangeTotalAmount) - Number(getReturnTotalAmount) < 0 ? 0.00 : Number(getChangeTotalAmount) - Number(getReturnTotalAmount).toFixed(2);

        const newCost = changedProducts.reduce((total, product) => total + Number(product.cost) * Number(product.quantity), 0).toFixed(2);
        const newPrice = changedProducts.reduce((total, product) => total + Number(product.price) * Number(product.quantity), 0).toFixed(2);
        const newDiscount = changedProducts.reduce((total, product) => total + Number(product.discount) * Number(product.quantity), 0).toFixed(2);

        setReturnTotalAmount(getReturnTotalAmount >= 0 ? getReturnTotalAmount : 0);
        setChangedTotalAmount(getChangeTotalAmount >= 0 ? getChangeTotalAmount : 0);       
        setRefundAmount(getRefundAmount);
        setTotalAmount(newTotal);
        setNewSaleData((prev) => ({ ...prev, total_amount: newTotal }));
        setNewSaleData((prev) => ({ ...prev, total_cost: newCost }));
        setNewSaleData((prev) => ({ ...prev, total_price: newPrice }));
        setNewSaleData((prev) => ({ ...prev, total_discount: newDiscount }));
        
    }, [returnProducts,changedProducts]);

    const handleReturnOption = (e) => {
        const selectedReturnOption = e.target.value; 
    
        const selected = returnOptions.find(p => p.id === selectedReturnOption);
    
        setSelectedReturnOption(selected.id);
    };

    const nextStep = () => {
        if (returnProducts.length === 0) {
            toastr.error("Add at least one (1) product"); 
            return;
        }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">New Return</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center mt-4">
                    <span className={`px-4 py-2 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 1: Products to Return / Refund</span>
                    <span className={`px-4 py-2 rounded-full ml-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 2: Change Products to / Refund</span>
                </div>

                {/* Step 1: Select Products */}
                {step === 1 && (
                    <>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Sales:</label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search Sales"
                                value={searchSales}
                                onChange={handleSalesSearch}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                            {/* Dropdown */}
                            {showDropdownSales && salesOptions.length > 0 && (
                                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                    {salesOptions.map((sales) => (
                                        <li
                                            key={sales.id} 
                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSelectSales(sales)}
                                        >
                                            Code: {sales.code} - Total Amount: {sales.total_amount}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-3">
                        {/* Product List Headers */}
                        <div className="mt-3 w-3/5">
                            <div className="flex justify-between items-center p-2 border-b bg-gray-200 font-semibold">
                                <span className="w-1/12 text-center">#</span>
                                <span className="w-3/12">Product</span>
                                <span className="w-2/12 text-right">Price</span>
                                <span className="w-1/12 text-right">Disc</span>
                                <span className="w-1/12 text-right">Qty</span>
                                <span className="w-2/12 text-right">Amount</span>
                            </div>

                            {/* Scrollable Product List */}
                            <div className="border max-h-[15rem] overflow-y-auto p-2">
                                {salesProducts?.map((product, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center p-2 border-b cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <span className="w-1/12 text-center">{index + 1}</span>
                                        <span className="w-3/12">{product.product_info?.name}</span>
                                        <span className="w-2/12 text-right">{product.price}</span>
                                        <span className="w-1/12 text-right">{product.discount_amount}</span>
                                        <span className="w-1/12 text-right">{product.qty}</span>
                                        <span className="w-2/12 text-right font-semibold">
                                            {Number(product.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Products to Return */}
                        <div className="mt-3 w-2/5">
                            <div className="border p-4 rounded-lg shadow-md bg-white max-h-[15rem] overflow-y-auto">
                                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">Products to Return</h3>

                                {returnProducts.length > 0 ? (
                                    <div className="space-y-2">
                                        {returnProducts.map((product, index) => (
                                            <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                                {/* Product Name */}
                                                <div className="text-gray-700 font-medium">{product.product_info?.name}</div>

                                                {/* Qty & Amount Row */}
                                                <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                                                    <div>Qty: <span className="font-semibold">{product.qty}</span></div>
                                                    <div>Amount: <span className="font-semibold text-gray-800">{Number(product.amount).toFixed(2)}</span></div>
                                                    <button 
                                                        className="text-red-500 hover:text-red-700 transition"
                                                        onClick={() => handleRemoveProduct(index)}
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 italic">No products selected.</p>
                                )}
                            </div>
                        </div> 
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={nextStep}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Next
                        </button>
                    </div>
                    </>
                )}
                
                {/* Actions */}
                {step === 2 && (
                    <>  
                    <div className="flex gap-4 mt-3">
                        {/* Left Side - Products for Return */}
                        <div className="mt-3 w-2/5 self-center">
                            <div className="border p-4 rounded-lg shadow-md bg-white">
                                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">Products for Return</h3>

                                {returnProducts.length > 0 ? (
                                    <div className="space-y-2 max-h-[15rem] overflow-y-auto">
                                        {returnProducts.map((product, index) => (
                                            <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                                {/* Product Name */}
                                                <div className="text-gray-700 font-medium">{product.product_info?.name}</div>

                                                {/* Qty & Amount Row */}
                                                <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                                                    <div>Qty: <span className="font-semibold">{product.qty}</span></div>
                                                    <div>Amount: <span className="font-semibold text-gray-800">{Number(product.amount).toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 italic">No products selected.</p>
                                )}

                                {/* Total Amount */}
                                <div className="flex justify-between items-center p-2 border-t font-semibold text-lg bg-white">
                                    <span className="w-3/4">Total Amount:</span>
                                    <span className="w-1/4 text-right">
                                        {returnTotalAmount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Product List Headers */}
                        <div className="mt-3 w-3/5">
                            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">Change Product to:</h3>
                            <div className="flex flex-col gap-4 mt-4 min-h-[5rem]">
                                {/* First Row: Product Dropdown & Price Selection */}
                                <div className="flex items-start gap-2">
                                    {/* Product Search with Dropdown */}
                                    <div className="relative w-2/3">
                                        <label className="block text-sm font-medium text-gray-700">Product:</label>
                                        <input 
                                            type="text"
                                            placeholder="Search Product"
                                            value={searchProduct}
                                            onChange={handleProductSearch}
                                            className="border px-3 py-2 rounded-lg w-full"
                                        />
                                        {/* Dropdown */}
                                        {showDropdownProducts && dropDownProducts.length > 0 && (
                                            <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                {dropDownProducts.map((product) => (
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

                                    {/* Price Selection */}
                                    <div className="w-1/3">
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
                                </div>

                                {/* Second Row: Cost, Quantity, Discount, and Amount */}
                                <div className="grid grid-cols-5 gap-2">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700">Cost:</label>
                                        <input 
                                            type="number"
                                            value={changedCost}
                                            className="border px-3 py-2 rounded-lg w-full"
                                            disabled
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                        <input 
                                            type="number"
                                            value={changedQty}
                                            onChange={(e) => setChangedQty(e.target.value)}
                                            className="border px-3 py-2 rounded-lg w-full"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700">Disc:</label>
                                        <input 
                                            type="number"
                                            value={changedDiscount}
                                            onChange={(e) => setChangedDiscount(e.target.value)}
                                            className="border px-3 py-2 rounded-lg w-full"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700">Amount:</label>
                                        <input 
                                            type="number"
                                            value={changedAmount}
                                            className="border px-3 py-2 rounded-lg w-full"
                                            disabled
                                        />
                                    </div>
                                    <div className="col-span-1 justify-end">
                                        <label className="text-sm font-medium text-white-600">&nbsp;</label>
                                        <button 
                                            onClick={handleAddProductChange}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>


                            {changedProducts.length > 0 ? (
                                <div className="space-y-2 max-h-[15rem] overflow-y-auto mt-4">
                                        {changedProducts.map((product, index) => (
                                            <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                                {/* Product Name */}
                                                <div className="text-gray-700 font-medium">{product.name}</div>

                                                {/* Qty & Amount Row */}
                                                <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                                                    <div>Qty: <span className="font-semibold">{product.quantity}</span></div>
                                                    <div>Discount: <span className="font-semibold">{product.discount}</span></div>
                                                    <div>Amount: <span className="font-semibold text-gray-800">{Number(product.amount).toFixed(2)}</span></div>
                                                    <button 
                                                        className="text-red-500 hover:text-red-700 transition"
                                                        onClick={() => handleChangedRemoveProduct(index)}
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            ) : (
                                <p className="text-center text-gray-500 italic mt-4">No products selected.</p>
                            )}

                            {/* Total Amount */}
                            <div className="flex justify-between items-center p-2 border-t font-semibold text-lg bg-white">
                                <span className="w-3/4">Total Amount:</span>
                                <span className="w-1/4 text-right">
                                    {changedTotalAmount}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                    <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Refund Amount:</label>
                                <input 
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    className="border px-3 py-2 rounded-lg w-full"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Reason:</label>
                                <select 
                                    value={selectedReturnOption}
                                    onChange={handleReturnOption}
                                    className="border px-3 py-2 rounded-lg w-full"
                                >
                                    {returnOptions.length > 0 && returnOptions.map((returnOption) => (
                                        <option key={returnOption.id} 
                                            value={returnOption.id}>
                                            {returnOption.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                                <textarea 
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    rows="3"
                                    placeholder="Enter remarks here..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Add Payment */}
                    {showAddPayment && (                    
                        <div className="grid grid-cols-2 gap-6 mt-4">
                                <div className="space-y-4">
                                    <div className="mb-3">
                                        <div className="flex gap-2 mb-2">
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
                                                    className="w-full border px-3 py-2 rounded-lg"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Options */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700">Payment Options:</label>
                                        <div className="relative max-h-40 overflow-y-auto">
                                            {newSaleData.paymentOptions.map((option, idx) => (
                                                <div key={idx} className="flex gap-2 mb-2 items-center">
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

                                                    {/* Amount (Auto-calculated) */}
                                                    <input
                                                        type="hidden"
                                                        value={option.amount}
                                                        className="border px-3 py-2 rounded-lg flex-1 bg-gray-200"
                                                        disabled
                                                    />

                                                    {/* Amount Paid */}
                                                    <input
                                                        type="number"
                                                        placeholder="Amount Paid"
                                                        value={option.amount_paid}
                                                        onChange={(e) => handlePaymentChange(idx, "amount_paid", e.target.value, e.target.value)}
                                                        className="border px-3 py-2 rounded-lg flex-1"
                                                    />

                                                    {/* Amount Change (Auto-calculated) */}
                                                    <input
                                                        type="hidden"
                                                        value={option.amount_change}
                                                        className="border px-3 py-2 rounded-lg flex-1 bg-gray-200"
                                                        disabled
                                                    />

                                                    {/* Remove Button (Only for index > 0) */}
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

                                        {/* Disable the Add Payment Option button if total is fully paid */}
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
                                <div className="border p-4 rounded-lg shadow-md bg-gray-100">
                                    <h3 className="text-lg font-semibold mb-4 text-center">Summary</h3>
                                    <p className="mb-2">
                                        <strong>Amount of Product/s return:</strong> {returnTotalAmount}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Amount of Product/s change:</strong> {changedTotalAmount}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Amount to Pay:</strong> {totalAmount}
                                    </p>
                                    <p className="text-blue-600 mb-2"><strong>Total Paid:</strong> {newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0).toFixed(2)}</p>
                                    <p className={`font-semibold ${totalAmount - newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        <strong>Change:</strong> {(
                                            newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) - totalAmount
                                        ).toFixed(2)}
                                    </p>
                                </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={prevStep}
                            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                        >
                            Back
                        </button>

                        <button 
                            onClick={toggleAddPayment}
                            disabled={Number(changedTotalAmount) + Number(refundAmount) <= Number(returnTotalAmount)}
                            className={`px-4 py-2 rounded-lg transition ${
                                Number(changedTotalAmount) + Number(refundAmount) <= Number(returnTotalAmount)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}>
                            Add Payment
                        </button>
                        
                        <button
                            onClick={confirmNewReturn}
                            disabled={Number(changedTotalAmount) + Number(refundAmount) > Number(returnTotalAmount) && isFullyPaid == false}
                            className={`px-4 py-2 rounded-lg transition ${
                                Number(changedTotalAmount) + Number(refundAmount) > Number(returnTotalAmount) && isFullyPaid == false
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}>
                            Submit
                        </button>                        
                    </div>                    

                    </>
                )}
            </div>

            {/* Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-5 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">{selectedProduct.product_info?.name}</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Price:</span>
                                <span>{selectedProduct.price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>{selectedProduct.discount_amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Qty:</span>
                                <input
                                    type="number"
                                    className="border p-1 w-16 text-right"
                                    value={qty}
                                    min="1"
                                    max={selectedProduct.qty}
                                    onChange={(e) => setQty(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Amount:</span>
                                <span>
                                    {Number((selectedProduct.price - selectedProduct.discount_amount) * qty).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 gap-2">
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="px-3 py-1 bg-gray-300 rounded">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSelectedSubmit}
                                className="px-3 py-1 bg-blue-500 text-white rounded" >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnsNewModal;
