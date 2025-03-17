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

const TransactionTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [selectedTransactionStatus, setSelectedTransactionStatus] = useState("all");
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
    const [step, setStep] = useState(1);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    
    const [searchService, setSearchService] = useState(null);
    const [services, setServices] = useState([]);
    const [showDropdownServices, setShowDropdownServices] = useState(false);
    const [showProductSelection, setShowProductSelection] = useState(false);

    const [serviceTransactionId, setServiceTransactionId] = useState(null);
    const [serviceId, setServiceId] = useState(null);
    const [servicePrice, setServicePrice] = useState(0);
    const [laborCost, setLaborCost] = useState(0);
    const [discount, setDiscount] = useState(0);

    const [productsList, setProductsList] = useState([]);
    const [productsSelected, setProductsSelected] = useState([]);    
    const [searchProduct, setSearchProduct] = useState(null);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);
    const [productId, setProductId] = useState(null);
    const [productName, setProductName] = useState(null);
    const [productCost, setProductCost] = useState(0);
    const [productQty, setProductQty] = useState(0);
    const [productTotalCost, setProductTotalCost] = useState(0);

    const [searchCustomer, setSearchCustomer] = useEffect("");
    const [showDropdownCustomers, setShowDropdownCustomers] = useEffect(false);
    const [customers, setCustomers] = useEffect([]);
    const [customerId, setCustomerId] = useEffect(null);
    const [customerName, setCustomerName] = useEffect(null);
    const [customerContactNo, setCustomerContactNo] = useEffect(null);
    const [customerEmail, setCustomerEmail] = useEffect(null);
    const [customerAddress, setCustomerAddress] = useEffect(null);
    
    useEffect(() => {
        fetchTransactions(selectedTransactionStatus);
    }, [search, page, dateRange, selectedTransactionStatus]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchTransactions = async (filterStatus) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/serviceTransactions`, {
                params: {
                    search: search,
                    page: page,
                    filterStatus: filterStatus,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTransactions(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
    };

    const handleServiceEdit = () => {

    };

    const handleServiceModal = (transaction) => {
        setIsTransactionModalOpen(true);
        if(serviceTransactionId){

        }else{

        }
    };

    const nextStep = () => {
        // if (products.length === 0) {
        //     toastr.error("Add at least one (1) product"); 
        //     return;
        // }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const handleServiceModalClose = () => {
        setServiceTransactionId(false);
        setIsTransactionModalOpen(false);        
    };

    const handleServiceSearch = async (e) => {
        const search = e.target.value;
        setSearchService(search);
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-services", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setServices(response.data);
                setShowDropdownServices(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setServices([]);
            setShowDropdownServices(false);
        }
    };

    const handleSelectService = (e) => {
        setSearchService(e.name);
        setServiceId(e.id);
        setServicePrice(e.price);
        setLaborCost(e.labor_cost);
        setDiscount(e.discount);
        const productsData = e.products.map(product => ({
            id: product.id,
            name: product.product.name_variant,
            cost: product.product.cost,
            qty: product.qty,
            total: product.product.cost * product.qty
        }));
        setProductsSelected(prevProducts => [...prevProducts, ...productsData]);
        setShowDropdownServices(false);
        
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
                setProductsList(response.data);
                setShowDropdownProducts(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setProductsList([]);
            setShowDropdownProducts(false);
        }
    };

    const handleSelectProduct = (product) => {
        setProductId(null);
        setProductCost(0);
        setProductTotalCost(0);

        setSearchProduct(product.name_variant);
        setProductName(product.name_variant);
        setProductId(product.id);
        setProductCost(product.cost);
        setProductQty(1);
        setProductTotalCost(product.cost);

        setShowDropdownProducts(false);
    };

    const handleChangeProductQty = (inputQty) => {
        const qty = parseFloat(inputQty);

        if (!isNaN(qty) && qty >= 0) {
            setProductQty(qty);
            setProductTotalCost(qty * productCost);
        } else {
            setProductQty(0);
            setProductTotalCost(0);
        }
    }

    const handleAddProduct = () => {
        if(productId==null){
            toastr.warning("No product selected!");
            return;
        } 

        if(productQty<=0){
            toastr.warning("Product quantity must be greater than 0!");
            return;
        }

        const newProduct = {
            id: productId,
            name: productName,
            cost: productCost,
            qty: productQty,
            total: productTotalCost
        };
    
        setProductsSelected((prevProducts) => [...prevProducts, newProduct]);
        
        setSearchProduct("");
        setProductName(null);
        setProductId(null);
        setProductCost(0);
        setProductQty(0);
        setProductTotalCost(0);
    };

    const handleRemoveProduct = async (product, index) => {
        
        Swal.fire({
            title: `Remove ${product.name}?`,
            text: `Are you sure you want to remove "${product.name}" costed at ${product.cost}? This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                setProductsSelected(productsList.filter((_, i) => i !== index));
                Swal.fire("Removed!", `"${product.name}" has been removed.`, "success");
            }
        });
    };

    const handleCustomerSearch = async (e) => {
        const query = e.target.value;
        if (query.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-customers", {
                    params: { search: query },
                    headers: { Authorization: `Bearer ${authToken}` },
                });                
                setCustomers(response.data.data);
                setShowDropdownCustomers(true);
            } catch (error) {
                // console.error("Error fetching customers:", error);
            }
        } else {
            setCustomers([]);
            setShowDropdownCustomers(false);
        }
    }

    const handleSelectCustomer = (e) => {
        setSearchCustomer(e.name);
        setCustomerId(e.id);
        setCustomerName(e.name);
        setCustomerContactNo(e.contact_no);
        setCustomerEmail(e.email);
        setCustomerAddress(e.address);
    };

    const handleSubmit = () => {

    };    

    const formatPhoneNumber = (value) => {
        // Remove all non-digit characters
        const cleaned = value.replace(/\D/g, '').slice(0, 11); // limit to 11 digits
      
        // Format to: 0912 345 6789
        const match = cleaned.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
      
        if (!match) return cleaned;
      
        return [match[1], match[2], match[3]].filter(Boolean).join('-');
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Service Transanctions</h1>
                    <button
                        onClick={() => handleServiceModal([])}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Transaction
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search transaction..."
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

                {/* Transaction Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Type of Service</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>                                
                                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Costs</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Income</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Service Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Payment Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions?.length > 0 ? (
                                transactions.map((transaction, index) => {
                                    return (
                                        <tr key={transaction.id}>
                                            <td className="border border-gray-300 px-4 py-2">{transaction.code}</td>
                                            <td className="border border-gray-300 px-4 py-2">{transaction.service_name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{transaction.customer_name}</td>
                                            <td className="border border-gray-300 px-4 py-2">₱{transaction.price}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <div className="text-sm">
                                                    <div><span className="font-medium">Product:</span> ₱{transaction.product_cost}</div>
                                                    <div><span className="font-medium">Labor:</span> ₱{transaction.labor_cost}</div>
                                                    <div><span className="font-medium">Discount:</span> ₱{transaction.discount}</div>
                                                    <div><span className="font-medium">Total:</span> ₱{transaction.total_cost}</div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">₱{transaction.amount}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {transaction.service_status?.name}
                                                <div className="text-sm">
                                                    <div><span className="font-medium">Started:</span>{transaction.date_started}</div>
                                                    <div><span className="font-medium">Finished:</span> {transaction.date_finished}</div>
                                                    <div><span className="font-medium">Out:</span> {transaction.day_out}</div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {transaction.payment_status?.name}
                                                <div className="text-sm">
                                                    <div><span className="font-medium">Price:</span> ₱{transaction.price}</div>
                                                    <div><span className="font-medium">Paid:</span> ₱{transaction.paid}</div>
                                                    <div><span className="font-medium">Remaining:</span> ₱{transaction.remaining}</div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">{transaction.remarks}</td>
                                            <td className="border border-gray-300 px-4 py-2 gap-2">
                                                {/* <button onClick={() => openSaleViewModal(sale)}
                                                    className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                    <Eye size={16} /> View
                                                </button> */}
                                                <button onClick={() => handleServiceModal(transaction)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                    <Edit size={16} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Service Transaction found.
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
                
                {isTransactionModalOpen && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                            {/* Header */}
                            <div className="flex justify-between mt-4">
                                <h2 className="text-xl font-semibold">
                                    {serviceTransactionId ? "Edit Transaction" : "New Transaction"}
                                </h2>
                                <button 
                                    onClick={handleServiceModalClose} 
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Step Indicators */}
                            <div className="flex justify-center mt-4">
                                <span className={`px-4 py-2 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 1: Service Info</span>
                                <span className={`px-4 py-2 rounded-full ml-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Step 2: Customer & Payment</span>
                            </div>

                            {/* Step 1: Service Info */}
                            {step === 1 && (
                                <div className="mt-4">                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Service:</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="Search Service"
                                                value={searchService}
                                                onChange={handleServiceSearch}
                                                className="border px-3 py-2 rounded-lg w-full"
                                            />
                                            {/* Dropdown */}
                                            {showDropdownServices && services?.length > 0 && (
                                                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                    {services.map((service) => (
                                                        <li 
                                                            key={service.id} 
                                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                                            onClick={() => handleSelectService(service)}
                                                        >
                                                            {service.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {/* Service Price */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Service Price:</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={servicePrice}
                                                    onChange={(e) => setServicePrice(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Service Price..."
                                                />
                                            </div>
                                        </div>
                                        {/* Labor Cost */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Labor Cost:</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={laborCost}
                                                    onChange={(e) => setLaborCost(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Labor Cost"
                                                />
                                            </div>
                                        </div>
                                        {/* Discount */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Discount:</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Discount"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full mt-4">
                                        {/* Button to toggle Product Search & Selection visibility */}
                                        <div className="mb-4">
                                            <button
                                                onClick={() => setShowProductSelection(!showProductSelection)} // Toggle visibility
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600"
                                            >
                                                {showProductSelection ? 'Cancel' : 'Add New Product'}
                                            </button>
                                        </div>
                                        
                                        {/* Product Search & Selection Section */}
                                        {showProductSelection && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {/* Product Search & Selection */}
                                                <div className="col-span-2 w-full">
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
                                                        {showDropdownProducts && productsList?.length > 0 && (
                                                            <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                                {productsList.map((product) => (
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
                                                <div className="w-full">
                                                    <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                                    <input 
                                                        type="number"
                                                        value={productQty}
                                                        onChange={(e) => handleChangeProductQty(e.target.value)}
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                    />
                                                </div>
                                                <div className="w-full flex items-end">
                                                    <button
                                                    onClick={handleAddProduct}
                                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600"
                                                    >
                                                    Add Product
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <table className="w-full mt-4 border border-gray-300 text-sm">
                                                <thead className="bg-gray-100 text-gray-700">
                                                    <tr>
                                                    <th className="border px-4 py-2 text-left">Product Name</th>
                                                    <th className="border px-4 py-2 text-left">Unit Cost</th>
                                                    <th className="border px-4 py-2 text-left">Quantity</th>
                                                    <th className="border px-4 py-2 text-left">Total</th>
                                                    <th className="border px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>  
                                                <tbody>
                                                    {productsSelected?.map((product, index) => (
                                                    <tr key={index}>
                                                        <td className="border px-4 py-2">{product.name}</td>
                                                        <td className="border px-4 py-2">₱{Number((product.cost)).toFixed(2)}</td>
                                                        <td className="border px-4 py-2">{product.qty}</td>
                                                        <td className="border px-4 py-2">₱{Number((product.total)).toFixed(2)}</td>
                                                        <td className="border px-4 py-2">
                                                        <button
                                                            onClick={() => handleRemoveProduct(product, index)}
                                                            className="text-red-500 hover:underline text-sm"
                                                        >
                                                            <X size={24} />
                                                        </button>
                                                        </td>
                                                    </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 float-right"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Customer & Payment */}
                            {step === 2 && (
                                <div className="mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Customer:</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="Search Customer"
                                                value={searchCustomer}
                                                onChange={handleCustomerSearch}
                                                className="border px-3 py-2 rounded-lg w-full"
                                            />
                                            {/* Dropdown */}
                                            {showDropdownCustomers && customers?.length > 0 && (
                                                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                    {customers.map((customer) => (
                                                        <li 
                                                            key={customer.id} 
                                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                                            onClick={() => handleSelectCustomer(customer)}
                                                        >
                                                            {customer.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {/* Customer Contact */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Contact No:</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={customerContactNo}
                                                    onChange={(e) => setCustomerContactNo(formatPhoneNumber(e.target.value))}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Contact No:..."
                                                />
                                            </div>
                                        </div>
                                        {/* Customer Email */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Email:</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={customerEmail}
                                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Email..."
                                                />
                                            </div>
                                        </div>
                                        {/* Customer Address */}
                                        <div>
                                            <label className="block text-sm font-medium mt-2">Address:</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={customerAddress}
                                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Address..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                                        >
                                            Save Transaction
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );

};

export default TransactionTransactions;