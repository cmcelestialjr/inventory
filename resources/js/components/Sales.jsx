import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Eye, Plus, X, Package, RotateCcw, ShoppingBag, Repeat, AlertTriangle, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import moment from "moment";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SalesViewModal from "./SalesViewsModal";

const Sales = () => {  
    const [sales, setSales] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchProduct, setSearchProduct] = useState(null);
    const [productOptions, setProductOptions] = useState([]);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);      
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
    const [totalAmount, setTotalAmount] = useState(0.00);
    const [step, setStep] = useState(1);
    const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
    const [isSaleViewModalOpen, setIsSaleViewModalOpen] = useState(false);
    const [selectedSaleView, setSelectedSaleView] = useState(null);
    const [saleId, setSaleId] = useState(null);
    const [salesStatuses, setSalesStatuses] = useState([]);
    const [selectedSaleStatus, setSelectedSaleStatus] = useState("all");
    const [totalSales, setTotalSales] = useState(0);
    const didFetch = useRef(false);

    const openSaleViewModal = (sale) => {
        setSelectedSaleView(sale);
        setIsSaleViewModalOpen(true);
    };

    const closeSaleViewModal = () => {
        setIsSaleViewModalOpen(false);
        setSelectedSaleView(null);
    };
    const nextStep = () => {
        if (products.length === 0) {
            toastr.error("Add at least one (1) product"); 
            return;
        }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const [dateRange, setDateRange] = useState([
        new Date(),
        new Date(),
    ]);
    const [startDate, endDate] = dateRange;

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
        if (didFetch.current) return;
        didFetch.current = true;
    
        const authToken = localStorage.getItem("token");
        
        axios.get("/api/fetch-payment-options", {
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
            toastr.error("Can't fetch payment options. Please refresh the page.");
        });
    }, []);

    useEffect(() => {    
        const authToken = localStorage.getItem("token");
        
        // Format dates if they are valid
        const formattedStartDate = startDate ? startDate.toISOString().split("T")[0] : null;
        const formattedEndDate = endDate ? endDate.toISOString().split("T")[0] : null;
    
        // Fetch sales statuses with date range
        axios.get("/api/fetch-sales-statuses", {
            params: {
                start_date: formattedStartDate,
                end_date: formattedEndDate
            },
            headers: { Authorization: `Bearer ${authToken}` },
        })
        .then(response => {
            if (response.data.success) {
                const statuses = response.data.data;
                setSalesStatuses(statuses);
    
                const total = statuses.reduce((sum, option) => sum + (option.sales_count || 0), 0);
                setTotalSales(total);
            } else {
                toastr.error("Failed to load sales statuses.");
            }
        })
        .catch(error => {
            toastr.error("Can't fetch sales statuses. Please refresh the page.");
        });
    }, [startDate, endDate]);
    

    useEffect(() => {
        fetchSales(selectedSaleStatus);
    }, [search, page, dateRange, selectedSaleStatus]);

    const fetchSales = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/sales`, {
                params: {
                    search: search,
                    page: page,
                    filter: filter,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setSales(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleEditSale = (sale) => {
        setSaleId(sale.id);
        const updatedProducts = sale.products_list?.map((productList) => ({
            id: productList.product_id,
            name: productList.product_info.name,
            totalCost: productList.total_cost,
            cost: productList.cost,
            price: productList.price,
            discount: productList.discount_amount,
            quantity: productList.qty,
            amount: productList.amount,
        }));
        setProducts(updatedProducts);
    
        const updatedPayments = (sale.payment_options?.length > 0
            ? sale.payment_options
            : [{
                payment_option_id: 1,
                payment_option_name: "Cash",
                amount: 0.00,
                amount_paid: 0.00,
                amount_change: 0.00
            }]
        ).map((paymentOption) => ({
            payment_option_id: paymentOption.payment_option_id,
            payment_option_name: paymentOption.payment_option_name,
            amount: paymentOption.amount,
            amount_paid: paymentOption.amount_paid,
            amount_change: paymentOption.amount_change
        }));
        
        
        setNewSaleData({
            ...newSaleData,
            paymentOptions: updatedPayments,
        });
        
        setIsNewSaleModalOpen(true);
    }

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
        if(productId==null){
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
    
        setProducts((prevProducts) => [...prevProducts, newProduct]);
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
        
        setTotalAmount(newTotal);
        setNewSaleData((prev) => ({ ...prev, total_amount: newTotal }));
        setNewSaleData((prev) => ({ ...prev, total_cost: newCost }));
        setNewSaleData((prev) => ({ ...prev, total_price: newPrice }));
        setNewSaleData((prev) => ({ ...prev, total_discount: newDiscount }));
    }, [products]);

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
            products,
            saleId: saleId
        };
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.post("/api/sales-confirm", updatedSaleData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success("Sale confirmed successfully!"); 
                setIsNewSaleModalOpen(false);
                setSaleId(null);
                setProducts([]);
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
                fetchSales(selectedSaleStatus);
            } else {
                toastr.error("Unexpected response");
            }
        } catch (error) {
            // console.error("Request failed:", error.response?.data?.message || error.message);
            toastr.error("Failed to confirm sale.");
        }
    };

    const handleCloseModal = () => {
        setIsNewSaleModalOpen(false);
        setSaleId(null);
        setProducts([]);
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
    };

    const handleSelectedSaleStatus = (salesStatus) => {
        setSelectedSaleStatus(salesStatus);
        setPage(1);
        fetchSales(salesStatus);
    };

    const icons = [
        (props) => <Repeat size={20} {...props} />, // For Payment
        (props) => <ShoppingBag size={20} {...props} />, // Paid
        (props) => <AlertTriangle size={20} {...props} />, // On-hold
        (props) => <XCircle size={20} {...props} />, // Cancelled
    ];
    
    const colors = [
        "bg-blue-800", // For Payment
        "bg-green-500", // Paid
        "bg-yellow-500", // On-hold
        "bg-red-500", // Cancelled
    ];
    
    const textColors = [
        "text-blue-800", // For Payment
        "text-green-500", // Paid
        "text-yellow-500", // On-hold
        "text-red-500", // Cancelled
    ];

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Sales</h1>
                    <button
                        onClick={() => setIsNewSaleModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Sale
                    </button>
                </div>

                {/* Summary Section (Sales Options) */}
                <div className="grid grid-cols-5 gap-6 mb-8">
                    <button
                        onClick={() => handleSelectedSaleStatus("all")}
                        className={`flex flex-col items-center p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedSaleStatus === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <Package size={24} className={`${selectedSaleStatus === "all" ? "text-white" : "text-blue-600"}`} />
                        <span className="text-sm font-semibold">All Sales</span>
                        <span className="text-lg font-bold">{totalSales}</span>
                    </button>

                    {salesStatuses.map((saleStatus, index) => {
                        const buttonColor = colors[index % colors.length];
                        const textColor = textColors[index % colors.length];
                        const Icon = icons[index % icons.length];

                        return (
                            <button
                                key={saleStatus.id}
                                onClick={() => handleSelectedSaleStatus(saleStatus.id)}
                                className={`flex flex-col items-center p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    selectedSaleStatus === saleStatus.id 
                                        ? `${buttonColor} text-white shadow-xl` 
                                        : `bg-white border border-gray-300 hover:bg-gray-100`
                                }`}
                            >
                                <Icon className={selectedSaleStatus === saleStatus.id ? "text-white" : textColor} />
                                <span className="text-sm font-semibold">{saleStatus.name}</span>
                                <span className="text-xl font-bold">
                                    {saleStatus.sales_count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search sales..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Single Calendar for Date Range */}
                    <DatePicker
                        selected={startDate}
                        onChange={(update) => setDateRange(update)}
                        startDate={startDate}
                        endDate={endDate}
                        selectsRange
                        isClearable
                        placeholderText="Select duration"
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Sales Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">DateTime</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Cashier</th>
                                {/* <th className="border border-gray-300 px-4 py-2 text-left">Customer</th> */}
                                {/* <th className="border border-gray-300 px-4 py-2 text-left">Cost</th> */}
                                <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                                {/* <th className="border border-gray-300 px-4 py-2 text-left">No. of Items</th> */}
                                <th className="border border-gray-300 px-4 py-2 text-left">Type of Payment</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales?.length > 0 ? (
                                sales.map((sale, index) => (
                                    <tr key={sale.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {moment(sale.date_time_of_sale).format("MMM D, YY h:mma")}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{sale.code}</td>
                                        <td className="border border-gray-300 px-4 py-2">{sale.cashier_name}</td>
                                        {/* <td className="border border-gray-300 px-4 py-2">{sale.customer_name}</td> */}
                                        {/* <td className="border border-gray-300 px-4 py-2">{sale.total_cost}</td> */}
                                        <td className="border border-gray-300 px-4 py-2">{sale.total_amount}</td>
                                        {/* <td className="border border-gray-300 px-4 py-2">{sale.total_qty}</td> */}
                                        <td className="border border-gray-300 px-4 py-2">
                                            {sale.payment_options && sale.payment_options.length > 0 ? (
                                                sale.payment_options?.map((paymentOption, idx) => (
                                                    <div key={idx}>
                                                        {/* Display payment_option_name and amount_paid */}
                                                        {paymentOption.payment_option_name} : {paymentOption.amount_paid}

                                                        {/* Display amount_change if it exists */}
                                                        {paymentOption.amount_change !== undefined && paymentOption.amount_change !== null ? (
                                                            paymentOption.amount_change > 0 ? (
                                                                <div className="text-green-500">
                                                                    Change: {paymentOption.amount_change}
                                                                </div>
                                                            ) : (
                                                                <div className="text-red-500">
                                                                    No Change
                                                                </div>
                                                            )
                                                        ) : null}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500">Awaiting Payment</div>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {/* Check sales_status_id and apply appropriate label and color */}
                                            {sale.sales_status_id === 1 && (
                                                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                                                For Payment
                                                </span>
                                            )}
                                            {sale.sales_status_id === 2 && (
                                                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full">
                                                Paid
                                                </span>
                                            )}
                                            {sale.sales_status_id === 3 && (
                                                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full">
                                                Transaction On-hold
                                                </span>
                                            )}
                                            {sale.sales_status_id === 4 && (
                                                <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full">
                                                Cancelled
                                                </span>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                            <button onClick={() => openSaleViewModal(sale)}
                                                className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                <Eye size={16} /> View
                                            </button>
                                            <button onClick={() => handleEditSale(sale)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                <Edit size={16} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Sales found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {meta && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={!meta.prev}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 rounded-lg ${meta.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Previous
                        </button>
                        <span>
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <button
                            disabled={!meta.next}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 rounded-lg ${meta.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {isNewSaleModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                {saleId === null ? "New Sale" : "Update Sale"}
                            </h2>
                            <button 
                                onClick={handleCloseModal} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Step Indicators */}
                        <div className="flex justify-center mb-4">
                            <span className={`px-4 py-2 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 1: Products</span>
                            <span className={`px-4 py-2 rounded-full ml-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 2: Customer & Payment</span>
                        </div>

                        {/* Step 1: Add Products */}
                        {step === 1 && (
                            <div className="flex gap-6">
                                {/* Left Side: Input Fields */}
                                <div className="w-2/5 space-y-4">
                                    {/* Date & Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date & Time:</label>
                                        <input 
                                            type="datetime-local"
                                            value={newSaleData.date_time_of_sale}
                                            onChange={(e) => setNewSaleData({ ...newSaleData, date_time_of_sale: e.target.value })}
                                            className="w-full border px-3 py-2 rounded-lg"
                                        />
                                    </div>

                                    {/* Product Search & Selection */}
                                    <div>
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
                                                            {product.name_variant}
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
                                </div>

                                {/* Right Side: Product List & Total Amount */}
                                <div className="w-3/5">
                                    {/* Product List Headers */}
                                        <div className="flex justify-between items-center p-2 border-b bg-gray-200 font-semibold">
                                            <span className="w-1/12 text-center">#</span>
                                            <span className="w-3/12">Product</span>
                                            <span className="w-2/12 text-right">Cost</span>
                                            <span className="w-2/12 text-right">Price</span>
                                            <span className="w-1/12 text-right">Disc</span>
                                            <span className="w-1/12 text-right">Qty</span>
                                            <span className="w-2/12 text-right">Amount</span>
                                            <span className="w-1/12 text-right"></span> 
                                        </div>

                                        {/* Scrollable Product List */}
                                        <div className="border max-h-[15rem] overflow-y-auto p-2">
                                            {products.map((product, index) => (
                                                <div key={index} className="flex justify-between items-center p-2 border-b">
                                                    <span className="w-1/12 text-center">{index + 1}</span>
                                                    <span className="w-3/12">{product.name}</span>
                                                    <span className="w-2/12 text-right">{product.cost}</span>
                                                    <span className="w-2/12 text-right">{product.price}</span>
                                                    <span className="w-1/12 text-right">{product.discount}</span>
                                                    <span className="w-1/12 text-right">{product.quantity}</span>
                                                    <span className="w-2/12 text-right font-semibold">{Number(product.amount).toFixed(2)}</span>
                                                    <span className="w-1/12 text-right">
                                                        <button
                                                            onClick={() => handleVoidProduct(product, index)} 
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                    {/* Total Amount */}
                                    <div className="flex justify-between items-center p-2 border-t font-semibold text-lg bg-white">
                                        <span className="w-3/4">Total Amount:</span>
                                        <span className="w-1/4 text-right">
                                            {products.reduce((total, product) => total + Number(product.amount), 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Step 2: Customer & Payment */}
                        {step === 2 && (
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Side - Form Inputs */}
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
                                    <p className="mb-2"><strong>Total Amount:</strong> {totalAmount}</p>
                                    <p className="text-blue-600 mb-2"><strong>Total Paid:</strong> {newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0).toFixed(2)}</p>
                                    <p className={`font-semibold ${totalAmount - newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        <strong>Change:</strong> {(
                                            newSaleData.paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) - totalAmount
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}


                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-2">
                            {step > 1 && (
                                <button onClick={prevStep} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Back</button>
                            )}                            
                            {step < 2 ? (
                                <>
                                    <button 
                                        onClick={handleAddProduct} 
                                        className="bg-blue-900 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add
                                    </button>
                                    <button 
                                        onClick={nextStep} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                    >
                                        Next
                                    </button>
                                </>
                            ) : (
                                <button onClick={confirmNewSale} className="px-4 py-2 bg-green-600 text-white rounded-lg">Confirm</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Component */}
            <SalesViewModal isOpen={isSaleViewModalOpen} onClose={closeSaleViewModal} sale={selectedSaleView} />
        </Layout>
    );
};

export default Sales;
