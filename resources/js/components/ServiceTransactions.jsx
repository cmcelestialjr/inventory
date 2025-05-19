import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Eye, Plus, X, Circle, PieChart, Clock, CheckCircle, PauseCircle, XCircle, Wallet, Save, Layers, CheckSquare } from "lucide-react";
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
    const [selectedTransactionStatus, setSelectedTransactionStatus] = useState("All");
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("All");
    const [step, setStep] = useState(1);
    const didFetch = useRef(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isTransactionPayModalOpen, setIsTransactionPayModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const [searchService, setSearchService] = useState(null);
    const [services, setServices] = useState([]);
    const [showDropdownServices, setShowDropdownServices] = useState(false);
    const [showProductSelection, setShowProductSelection] = useState(false);

    const [serviceTransactionId, setServiceTransactionId] = useState(null);
    const [serviceId, setServiceId] = useState(null);
    const [serviceName, setServiceName] = useState(null);
    const [servicePrice, setServicePrice] = useState(0);
    const [serviceVat, setServiceVat] = useState(0);
    const [serviceStartDate, setServiceStartDate] = useState(new Date());
    const [laborCost, setLaborCost] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [amountToPaid, setAmountToPaid] = useState(0);
    const [remarks, setRemarks] = useState(null);

    const [productsList, setProductsList] = useState([]);
    const [productsSelected, setProductsSelected] = useState([]);    
    const [searchProduct, setSearchProduct] = useState(null);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);
    const [productId, setProductId] = useState(null);
    const [productName, setProductName] = useState(null);
    const [productCost, setProductCost] = useState(0);
    const [productQty, setProductQty] = useState(0);
    const [productTotalCost, setProductTotalCost] = useState(0);

    const [searchCustomer, setSearchCustomer] = useState("");
    const [showDropdownCustomers, setShowDropdownCustomers] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState(null);
    const [customerName, setCustomerName] = useState(null);
    const [customerContactNo, setCustomerContactNo] = useState(null);
    const [customerEmail, setCustomerEmail] = useState(null);
    const [customerAddress, setCustomerAddress] = useState(null);
    
    const [paymentStatus, setPaymentStatus] = useState(1);
    const [availablePaymentStatuses, setAvailablePaymentStatuses] = useState([]);
    const [availablePaymentOptions, setAvailablePaymentOptions] = useState([]);

    const [transactionPayments, setTransactionPayments] = useState([]);
    const [transactionInfo, setTransactionInfo] = useState(null);
    const [isNewPayment, setIsNewPayment] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [serviceStatusesOptions, setServiceStatusesOptions] = useState([]);
    const [serviceDateFinished, setServiceDateFinished] = useState(null);
    const [serviceDateOut, setServiceDateOut] = useState(null);

    const [sortColumn, setSortColumn] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");

    const formatDateTime = (dateString) => {
        const formattedDate = moment(dateString);

        if (!formattedDate.isValid()) {
            return '';
        }

        return formattedDate.format("MMM D, YYYY h:mma");
    };
    const [paymentOptions, setPaymentOptions] = useState([
        {
            transaction_payment_id: null,
            payment_option_id: 1,
            payment_option_name: "Cash",
            amount_paid: 0.00,
            date: new Date(),
        }
    ]);

    const [newPayment, setNewPayment] = useState([]);

    const [serviceStatuses, setServiceStatuses] = useState({ 
        total: 0, 
        ongoing: 0, 
        done: 0,
        cancelled: 0,
        onhold: 0,
    });

    const [paymentStatuses, setPaymentStatuses] = useState({ 
        total: 0, 
        none: 0, 
        partial: 0,
        fully: 0,
    });

    useEffect(() => {
         if (didFetch.current) return;
        didFetch.current = true;
        const fetchData = async () => {
            try {
                const authToken = localStorage.getItem("token");
    
                const paymentOptionsResponse = await axios.get("/api/fetch-payment-options", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                if (paymentOptionsResponse.data.success) {
                    setAvailablePaymentOptions(paymentOptionsResponse.data.data.filter(option => option.id !== 4));
                } else {
                    toastr.error("Failed to load payment options.");
                }
    
                const paymentStatusesResponse = await axios.get("/api/fetch-payment-statuses", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                if (paymentStatusesResponse.data.success) {
                    const statuses = paymentStatusesResponse.data.data;
                    setAvailablePaymentStatuses(statuses);
                    setPaymentStatus(statuses[0]?.id || 1);
                } else {
                    toastr.error("Failed to load payment statuses.");
                }

                const serviceStatusesResponse = await axios.get("/api/fetch-service-statuses", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (serviceStatusesResponse.data.success) {
                    const statuses = serviceStatusesResponse.data.data;
                    setServiceStatusesOptions(statuses);
                } else {
                    toastr.error("Failed to load service statuses.");
                }
                
            } catch (error) {
                toastr.error("Can't fetch data. Please refresh the page.");
            }
        };
    
        fetchData();
    }, []);
    

    useEffect(() => {
        fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
    }, [search, page, dateRange, selectedTransactionStatus, selectedPaymentStatus, sortColumn, sortOrder]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchTransactions = async (filterStatus,filterPayment) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/service-transactions`, {
                params: {
                    search: search,
                    page: page,
                    filterPayment: filterPayment,
                    filterStatus: filterStatus,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null,
                    sort_column: sortColumn, 
                    sort_order: sortOrder,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTransactions(response.data.data);
            setMeta(response.data.meta);

            const serviceStatusesCountResponse = await axios.get("/api/fetch-service-statuses-count", {
                params: {
                    search: search,
                    filterPayment: filterPayment,
                    filterStatus: filterStatus,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
    
            if (serviceStatusesCountResponse.data.success) {
                const statuses = serviceStatusesCountResponse.data.data;
                setServiceStatuses(statuses);
                setPaymentStatuses(statuses);
            }
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
        
    };

    const handleSort = (column) => {
        const newSortOrder = 
            sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    
        setSortColumn(column);
        setSortOrder(newSortOrder);
    };

    const handleServiceModal = (transaction) => {
        setIsTransactionModalOpen(true);

        if(transaction && transaction.id){
            const vat = parseFloat((transaction.price / 1.12 * 0.12).toFixed(2));
            setServiceTransactionId(transaction.id);
            setServiceId(transaction.service_id);
            setSearchService(transaction.service_name);
            setServiceName(transaction.service_name);
            setServicePrice(transaction.price);
            setServiceVat(vat);
            setLaborCost(transaction.labor_cost);
            setDiscount(transaction.discount);
            setRemarks(transaction.remarks);
            setProductsSelected(transaction.products);
            setCustomerId(transaction.customer_id);
            setCustomerName(transaction.customer_name);
            setSearchCustomer(transaction.customer_name);
            setCustomerContactNo(transaction.customer_info?.contact_no);
            setCustomerEmail(transaction.customer_info?.email);
            setCustomerAddress(transaction.customer_info?.address);
            setPaymentStatus(transaction.payment_status_id);
            setAmountToPaid(transaction.amount);
            setServiceStartDate(transaction.date_started);

            const updatedProducts = transaction.products?.map((productList) => ({
                pid: productList.id,
                id: productList.product_id,
                name: productList.product_info.name_variant,
                cost: productList.cost,
                qty: productList.qty,
                total: productList.total,
            }));
            setProductsSelected(updatedProducts);

            const updatedPayments = (transaction.payments?.length > 0
                ? transaction.payments
                : [{
                    transaction_payment_id: null,
                    payment_option_id: 1,
                    payment_option_name: "Cash",
                    amount: 0.00,
                    payment_date: new Date()
                }]
            ).map((paymentOption) => {
                let paymentDate = new Date(paymentOption.payment_date);

                if (isNaN(paymentDate.getTime())) {
                    paymentDate = new Date();
                }

                return {
                    transaction_payment_id: paymentOption.id,
                    payment_option_id: paymentOption.payment_option_id,
                    payment_option_name: paymentOption.payment_option_name,
                    amount_paid: paymentOption.amount,
                    date: paymentDate
                };
            });
            
            setPaymentOptions(updatedPayments);
        }
    };

    const nextStep = () => {
        if (serviceId === null) {
            toastr.error("Please select a service..."); 
            return;
        }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const handleServiceModalClose = () => {
        setServiceTransactionId(false);
        setSearchProduct("");
        setSearchCustomer("");
        setServiceId(null);
        setServiceName(null);
        setServicePrice(null);
        setServiceVat(null);
        setLaborCost(null);
        setDiscount(0);
        setRemarks(null);
        setProductsSelected([]);
        setCustomerId(null);
        setCustomerName(null);
        setCustomerContactNo(null);
        setCustomerEmail(null);
        setCustomerAddress(null);
        setAmountToPaid(null);
        setPaymentStatus(1);
        setServiceStartDate(new Date());
        setShowProductSelection(false);
        setPaymentOptions([
            {
                transaction_payment_id: null,
                payment_option_id: 1,
                payment_option_name: "Cash",
                amount_paid: 0.00,
                date: new Date(),
            }
        ]);
        setStep(1);
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

    const handleSelectService = (service) => {
        const vat = parseFloat((service.price / 1.12 * 0.12).toFixed(2));
        setSearchService(service.name);
        setServiceId(service.id);
        setServiceName(service.name);
        setServicePrice(service.price);
        setServiceVat(vat);
        setAmountToPaid(Number(service.price)-Number(service.discount));
        setLaborCost(service.labor_cost);
        setDiscount(service.discount);
        const productsData = service.products?.map(product => ({
            pid: null,
            id: product.product?.id,
            name: product.product?.name_variant,
            cost: product.product?.cost,
            qty: product.qty,
            total: product.product?.cost * product.qty
        }));
        if (productsData && productsData.length > 0) {
            setProductsSelected(productsData);
        }
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
            pid: null,
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
                if(product.pid!=null){
                    try {
                        const authToken = localStorage.getItem("token");
                        const response = await axios.get("/api/service-transactions/removeProduct", {
                            params: { id: product.pid },
                            headers: { Authorization: `Bearer ${authToken}` },
                        });
                        if (response.data.message === 'Product deleted successfully.') {
                            setProductsSelected((prevProducts) => prevProducts.filter((_, i) => i !== index));
                            fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
                            Swal.fire("Removed!", `"${product.name}" has been removed.`, "success");
                        } else {
                            Swal.fire("Error", response.data.message, "error");
                        }
                    } catch (error) {
                        // console.error("Error fetching products:", error);
                        Swal.fire("Error", "An error occurred while removing the product.", "error");
                    }
                }else{
                    setProductsSelected(productsList.filter((_, i) => i !== index));
                    Swal.fire("Removed!", `"${product.name}" has been removed.`, "success");
                }
            }
        });
    };

    const handleRemovePayment = async (option, idx) => {
        Swal.fire({
            title: `Remove ${option.payment_option_name}?`,
            text: `Are you sure you want to remove payment "${option.payment_option_name}" costed at ${option.amount_paid} dated ${formatDateTime(option.date)}? This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove it!",
        }).then(async (result) => {
            if (result.isConfirmed) {

                if(option.transaction_payment_id!=null){
                    try {
                        const authToken = localStorage.getItem("token");
                        const response = await axios.get("/api/service-transactions/removePayment", {
                            params: { id: option.transaction_payment_id },
                            headers: { Authorization: `Bearer ${authToken}` },
                        });
                        if (response.data.message === 'Payment deleted successfully.') {
                            setPaymentOptions(paymentOptions.filter((_, i) => i !== idx));
                            fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
                            Swal.fire("Removed!", `"${option.payment_option_name}" costed at ${option.amount_paid} has been removed.`, "success");
                        } else {
                            Swal.fire("Error", response.data.message, "error");
                        }
                    } catch (error) {
                        // console.error("Error fetching products:", error);
                        Swal.fire("Error", "An error occurred while removing the payment.", "error");
                    }
                }else{
                    setPaymentOptions(paymentOptions.filter((_, i) => i !== idx));
                    Swal.fire("Removed!", `"${option.payment_option_name}" costed at ${option.amount_paid} has been removed.`, "success");
                }
            }
        });
        
    };

    const handleCustomerSearch = async (e) => {
        const query = e.target.value;
        setSearchCustomer(query);
        setCustomerName(query);
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
        setShowDropdownCustomers(false);
    };
    
    const handlePaymentChange = (idx, field, id, value) => {
        let updatedPayments = [...paymentOptions];
    
        if (field === "payment_option_name") {
            updatedPayments[idx][field] = value;
            updatedPayments[idx]["payment_option_id"] = id; 
        } else if (field === "date") {
            updatedPayments[idx][field] = value;
        } else {
            updatedPayments[idx][field] = parseFloat(value) || 0;
        }

        setPaymentOptions(updatedPayments);
    };

    const handleTransactionPaymentChange = (idx, field, id, value) => {
        let updatedPayments = [...transactionPayments];
    
        if (field === "payment_option_name") {
            updatedPayments[idx][field] = value;
            updatedPayments[idx]["payment_option_id"] = id; 
        } else if (field === "payment_date") {
            updatedPayments[idx][field] = value;
        } else {
            updatedPayments[idx][field] = parseFloat(value) || 0;
        }
        
        setTransactionPayments(updatedPayments);
    };

    const addPaymentOption = () => {
        let totalPaid = paymentOptions.reduce((sum, p) => sum + p.amount_paid, 0);
        
        if (totalPaid >= amountToPaid) return;
        
        let updatedPayments = [...paymentOptions];
        updatedPayments.push({
            transaction_payment_id: null,
            payment_option_id: 1,
            payment_option_name: "Cash",
            amount_paid: 0.00,
            date: new Date(),
        });
    
        setPaymentOptions(updatedPayments);
    };

    const isFullyPaid = paymentOptions.reduce((sum, p) => sum + p.amount_paid, 0) >= amountToPaid;  

    const handleSubmit = async () => {
        if(paymentStatus==2 && paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid)))<1){
            toastr.error("Please input amount of payment..");
            return;
        } else if(paymentStatus==3 && paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid)))<amountToPaid){
            toastr.error("Payment should cover the amount to be paid...");
            return;
        }

        if(customerName==='' || customerName===null){
            toastr.error("Customer is required");
            return;
        }

        try {
            const formData = {
                serviceTransactionId: serviceTransactionId,
                serviceId: serviceId,
                serviceName: serviceName,
                serviceStartDate: serviceStartDate,
                servicePrice: servicePrice,
                laborCost: laborCost,
                discount: discount,
                remarks: remarks,
                productsSelected: productsSelected,
                customerId: customerId,
                customerName: customerName,
                customerContactNo: customerContactNo,
                customerEmail: customerEmail,
                customerAddress: customerAddress,
                paymentStatus: paymentStatus,
                paymentOptions: paymentOptions,
            };

            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/service-transactions/manage`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setSearchProduct("");
                setSearchCustomer("");
                setServiceTransactionId(false);
                setServiceId(null);
                setServiceName(null);
                setServicePrice(null);
                setServiceVat(null);
                setLaborCost(null);
                setDiscount(0);
                setRemarks(null);
                setProductsSelected([]);
                setCustomerId(null);
                setCustomerName(null);
                setCustomerContactNo(null);
                setCustomerEmail(null);
                setCustomerAddress(null);
                setAmountToPaid(null);
                setPaymentStatus(1);
                setServiceStartDate(new Date());
                setShowProductSelection(false);
                setPaymentOptions([
                    {
                        payment_option_id: 1,
                        payment_option_name: "Cash",
                        amount_paid: 0.00
                    }
                ]);
                setStep(1);
                setIsTransactionModalOpen(false);
                fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
            }else{
                toastr.error("Error! There is something wrong in saving service transaction.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the service transaction.";
            toastr.error(errorMessage);
        }
    };

    const handlePayModal = (transaction) => {
        setIsTransactionPayModalOpen(true);
        setIsNewPayment(false);
        setServiceTransactionId(transaction.id);
        setTransactionPayments(transaction.payments);
        setTransactionInfo(transaction);
    };

    const handleTransactionPayModalClose = () => {
        setIsTransactionPayModalOpen(false);
        setIsNewPayment(false);
        setServiceTransactionId(null);
        setTransactionPayments([]);
    };

    const handleEditClick = (idx) => {
        setEditingRow(editingRow === idx ? null : idx);
    };

    const handleSaveClick = async (transactionPayment, idx) => {
        try {
            const formData = {
                serviceTransactionId: serviceTransactionId,
                payment: transactionPayment
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/service-transaction-payment/payment`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setEditingRow(null);
                setIsNewPayment(false);
                const paymentData = response.data.data;
                setTransactionInfo(paymentData);
                setTransactionPayments(paymentData.payments);
                fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
            }else{
                toastr.error("Error! There is something wrong in saving payment transaction.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the payment transaction.";
            toastr.error(errorMessage);
        }
    };

    const handleNewPayment = () => {
        setNewPayment({
            service_transaction_id: transactionInfo.id,
            payment_option_id: 1,
            payment_option_name: "Cash",
            amount: transactionInfo.remaining,
            payment_date: new Date(),
            amount_paid: transactionInfo.remaining,
            change: 0,
        });
        setIsNewPayment(true);
    };

    
    const handleNewPaymentChange = (field, id, value) => {
        let updatedPayments = { ...newPayment };
    
        if (field === "payment_option_name") {
            updatedPayments[field] = value;
            updatedPayments["payment_option_id"] = id; 
        } else if (field === "date") {
            updatedPayments[field] = value;
        } else {
            updatedPayments[field] = parseFloat(value) || 0;

            if (field === "amount_paid") {
                updatedPayments["change"] = Number(value) - Number(newPayment.amount);
            }else{
                updatedPayments["change"] = Number(newPayment.amount_paid) - Number(value);
            }
        }

        setNewPayment(updatedPayments);
    };

    const handleCancelNewPayment = () => {
        setNewPayment({
            service_transaction_id: transactionInfo.id,
            payment_option_id: 1,
            payment_option_name: "Cash",
            amount: transactionInfo.remaining,
            payment_date: new Date(),
            amount_paid: transactionInfo.remaining,
            change: 0,
        });
        setIsNewPayment(false);
    }

    const formatPhoneNumber = (value) => {

        const cleaned = value.replace(/\D/g, '').slice(0, 11); 

        const match = cleaned.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
      
        if (!match) return cleaned;
      
        return [match[1], match[2], match[3]].filter(Boolean).join('-');
    };    

    const formatPrice = (price) => {
        if (Number(price) === 0) return ' -';
        return `₱${Number(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    const formatDate = (dateString) => {
        const formattedDate = moment(dateString);

        if (!formattedDate.isValid()) {
            return '';
        }
        
        return formattedDate.format("MMM D, YYYY");
    };

    const handleStatusModal = (transaction) => {
        setIsStatusModalOpen(true);
        setServiceTransactionId(transaction.id);
        setServiceStatus(transaction.service_status_id);
        setServiceStartDate(transaction.date_started);
        setServiceDateFinished(transaction.date_finished);
        setServiceDateOut(transaction.day_out);
    };

    const handleStatusModalClose = () => {
        setIsStatusModalOpen(false);
        setServiceTransactionId(null);
        setServiceStatus(null);
        setServiceStartDate(new Date());
        setServiceDateFinished(null);
        setServiceDateOut(null);
    };

    const handleSelectedServiceStatus = (status) => {
        setSelectedTransactionStatus(status);
        setSelectedPaymentStatus("All");
    };

    const handleSelectedPaymentStatus = (status) => {
        setSelectedPaymentStatus(status);
        setSelectedTransactionStatus(null);
    };

    const handleServiceStatusSubmit = async () => {
        try {
            const formData = {
                serviceTransactionId: serviceTransactionId,
                serviceStatus: serviceStatus,
                serviceStartDate: serviceStartDate,
                serviceDateFinished: serviceDateFinished,
                serviceDateOut: serviceDateOut,
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/service-status/save`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setIsStatusModalOpen(false);
                setServiceTransactionId(null);
                setServiceStatus(null);
                setServiceStartDate(new Date());
                setServiceDateFinished(null);
                setServiceDateOut(null);
                fetchTransactions(selectedTransactionStatus, selectedPaymentStatus);
            }else{
                toastr.error("Error! There is something wrong in saving service status.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the service status.";
            toastr.error(errorMessage);
        }
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
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

                {/* Summary Section */}
                <div className="grid grid-cols-8 gap-3 mb-4">
                    <button
                        onClick={() => handleSelectedServiceStatus("All")}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedTransactionStatus === "All" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <Layers size={24} className={`${selectedTransactionStatus === "All" ? "text-white" : "text-blue-600"}`} />
                        <span className="text-sm font-semibold">All Services</span>
                        <span className="text-lg font-bold">{serviceStatuses.total}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedServiceStatus(1)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedTransactionStatus === 1 ? "bg-blue-500 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <Clock size={24} className={`${selectedTransactionStatus === 1 ? "text-white" : "text-blue-500"}`} />
                        <span className="text-sm font-semibold">Ongoing Services</span>
                        <span className="text-lg font-bold">{serviceStatuses.ongoing}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedServiceStatus(2)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedTransactionStatus === 2 ? "bg-green-600 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <CheckCircle size={24} className={`${selectedTransactionStatus === 2 ? "text-white" : "text-green-600"}`} />
                        <span className="text-sm font-semibold">Done Services</span>
                        <span className="text-lg font-bold">{serviceStatuses.done}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedServiceStatus(4)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedTransactionStatus === 4 ? "bg-yellow-600 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <PauseCircle size={24} className={`${selectedTransactionStatus === 4 ? "text-white" : "text-yellow-600"}`} />
                        <span className="text-sm font-semibold">On-hold Services</span>
                        <span className="text-lg font-bold">{serviceStatuses.onhold}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedServiceStatus(3)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedTransactionStatus === 3 ? "bg-red-600 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <XCircle size={24} className={`${selectedTransactionStatus === 3 ? "text-white" : "text-red-600"}`} />
                        <span className="text-sm font-semibold">Cancelled Services</span>
                        <span className="text-lg font-bold">{serviceStatuses.cancelled}</span>
                    </button>
                {/* </div>


                <div className="grid grid-cols-4 gap-6 mb-8"> */}
                    <button
                        onClick={() => handleSelectedPaymentStatus(1)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedPaymentStatus === 1 ? "bg-red-500 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <Circle size={24} className={`${selectedPaymentStatus === 1 ? "text-white" : "text-red-500"}`} />
                        <span className="text-sm font-semibold">None Payment</span>
                        <span className="text-lg font-bold">{paymentStatuses.none}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedPaymentStatus(2)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedPaymentStatus === 2 ? "bg-green-500 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <PieChart size={24} className={`${selectedPaymentStatus === 2 ? "text-white" : "text-yellow-500"}`} />
                        <span className="text-sm font-semibold">Partial Payment</span>
                        <span className="text-lg font-bold">{paymentStatuses.partial}</span>
                    </button>
                    <button
                        onClick={() => handleSelectedPaymentStatus(3)}
                        className={`flex flex-col items-center p-3 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            selectedPaymentStatus === 3 ? "bg-green-500 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <CheckCircle size={24} className={`${selectedPaymentStatus === 3 ? "text-white" : "text-green-500"}`} />
                        <span className="text-sm font-semibold">Fully Paid</span>
                        <span className="text-lg font-bold">{paymentStatuses.fully}</span>
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
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("code")}
                                >
                                    <div className="flex items-center">
                                        <span>Code</span>
                                        <span className="ml-1">
                                            {sortColumn === "code" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("service_name")}
                                >
                                    <div className="flex items-center">
                                        <span>Type of Service</span>
                                        <span className="ml-1">
                                            {sortColumn === "service_name" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("customer_name")}
                                >
                                    <div className="flex items-center">
                                        <span>Customer</span>
                                        <span className="ml-1">
                                            {sortColumn === "customer_name" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("amount")}
                                >
                                    <div className="flex items-center">
                                        <span>Price</span>
                                        <span className="ml-1">
                                            {sortColumn === "amount" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("total_cost")}
                                >
                                    <div className="flex items-center">
                                        <span>Costs</span>
                                        <span className="ml-1">
                                            {sortColumn === "total_cost" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("income")}
                                >
                                    <div className="flex items-center">
                                        <span>Income</span>
                                        <span className="ml-1">
                                            {sortColumn === "income" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("service_status_id")}
                                >
                                    <div className="flex items-center">
                                        <span>Service Status</span>
                                        <span className="ml-1">
                                            {sortColumn === "service_status_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("payment_status_id")}
                                >
                                    <div className="flex items-center">
                                        <span>Payment Status</span>
                                        <span className="ml-1">
                                            {sortColumn === "payment_status_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("remarks")}
                                >
                                    <div className="flex items-center">
                                        <span>Remarks</span>
                                        <span className="ml-1">
                                            {sortColumn === "remarks" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
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
                                            <td className="border border-gray-300 px-4 py-2">
                                                <div className="text-sm">
                                                    <div className="text-blue-600">
                                                        <span className="font-medium">Price:</span> 
                                                        <span>
                                                            {Number(transaction.price) === 0 ? ' -' : formatPrice(transaction.price)}
                                                        </span>
                                                    </div>
                                                    <div className="text-red-600">
                                                        <span className="font-medium">Discount:</span> 
                                                        <span>
                                                            {Number(transaction.discount) === 0 ? ' -' : formatPrice(transaction.discount)}
                                                        </span>
                                                    </div>
                                                    <div className="text-green-800">
                                                        <span className="font-medium">Total:</span> 
                                                        <span>
                                                            {Number(transaction.amount) === 0 ? ' -' : formatPrice(transaction.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <div className="text-sm">
                                                    <div>
                                                        <span className="font-medium">Product:</span> 
                                                        {Number(transaction.product_cost) === 0 ? ' -' : formatPrice(transaction.product_cost)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Labor:</span> 
                                                        {Number(transaction.labor_cost) === 0 ? ' -' : formatPrice(transaction.labor_cost)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Total:</span> 
                                                        {Number(transaction.total_cost) === 0 ? ' -' : formatPrice(transaction.total_cost)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className="text-green-800">
                                                    {formatPrice(transaction.income)}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`text-${transaction.service_status?.color}-800`}>
                                                    {transaction.service_status?.name}
                                                </span>
                                                <div className="text-sm">
                                                    <div><span className="font-medium">Started:</span>{formatDate(transaction.date_started)}</div>
                                                    <div><span className="font-medium">Finished:</span> {formatDate(transaction.date_finished)}</div>
                                                    <div><span className="font-medium">Out:</span> {formatDate(transaction.day_out)}</div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`text-${transaction.payment_status?.color}-800`}>
                                                    {transaction.payment_status?.name}
                                                </span>
                                                {Number(transaction.paid) > 0 && (
                                                    <div className="text-sm">
                                                        <div className="text-green-800">
                                                            <span className="font-medium">Paid:</span> 
                                                            <span>
                                                                {Number(transaction.paid) === 0 ? ' -' : formatPrice(transaction.paid)}
                                                            </span>
                                                        </div>
                                                        {transaction.remaining > 0 && (
                                                            <div className="text-red-600">
                                                                <span className="font-medium">Remaining:</span> 
                                                                <span>
                                                                    {Number(transaction.remaining) === 0 ? ' -' : formatPrice(transaction.remaining)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                                <button onClick={() => handlePayModal(transaction)}
                                                    className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                    <Wallet size={16} /> Pay
                                                </button>
                                                <button onClick={() => handleStatusModal(transaction)}
                                                    className="flex items-center gap-1 text-amber-800 hover:text-amber-600 hover:underline">
                                                    <CheckSquare size={16} /> Status
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
                    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
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
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div className="col-span-2">
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

                                        {/* Date and Time Picker */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Start of Service:</label>
                                            <DatePicker
                                                selected={serviceStartDate}
                                                onChange={(date) => setServiceStartDate(date)}
                                                className="border px-3 py-2 rounded-lg w-full"
                                            />
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
                                                    onChange={(e) => { 
                                                        const vat = parseFloat((servicePrice / 1.12 * 0.12).toFixed(2));
                                                        setServicePrice(e.target.value);
                                                        setAmountToPaid(Number(e.target.value)-Number(discount));
                                                        setServiceVat(vat);
                                                    }}
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
                                                    onChange={(e) => {
                                                        setDiscount(e.target.value);
                                                        setAmountToPaid(Number(servicePrice)-Number(e.target.value));
                                                    }}
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
                                                onClick={() => setShowProductSelection(!showProductSelection)}
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
                                                                        className="p-2 cursor-pointer hover:bg-gray-200 flex items-center space-x-2"
                                                                        onClick={() => handleSelectProduct(product)}
                                                                    >
                                                                        <img
                                                                            src={product.img}
                                                                            alt={product.name}
                                                                            className="w-16 h-16 object-cover rounded cursor-pointer"
                                                                        />
                                                                        <span>{product.code}-{product.name_variant}</span>
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
                                                        <td className="border px-4 py-2">₱{Number((product.cost)).toFixed(2).toLocaleString()}</td>
                                                        <td className="border px-4 py-2">{product.qty}</td>
                                                        <td className="border px-4 py-2">₱{Number((product.total)).toFixed(2).toLocaleString()}</td>
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
                                            onClick={() => nextStep()}
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

                                    <div className="grid grid-cols-3 gap-2">
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
                                    
                                    {/* Left Side - Form Inputs */}
                                    <div className="space-y-4 mt-4">
                                        <label className="block text-sm font-medium text-gray-700">Payment Options:</label>
                                        <div className="relative">
                                            {/* Payment Type Dropdown */}
                                            <select
                                                value={paymentStatus}
                                                onChange={(e) => setPaymentStatus(e.target.value)}
                                                className="border px-2 py-2 rounded-lg w-full"
                                            >
                                                {availablePaymentStatuses.map((payment) => (
                                                    <option key={payment.id} value={payment.id}>
                                                        {payment.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                            
                                            {paymentStatus > 1 && (
                                                <div className="relative">
                                                    <div className="relative">
                                                        {paymentOptions.map((option, idx) => (
                                                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                                                {/* Payment Type Dropdown */}
                                                                <select
                                                                    value={JSON.stringify({ id: option.payment_option_id, name: option.payment_option_name })}
                                                                    onChange={(e) => {
                                                                        const selectedValue = JSON.parse(e.target.value);
                                                                        handlePaymentChange(idx, "payment_option_name", selectedValue.id, selectedValue.name);
                                                                    }}
                                                                    className="border px-3 py-2 rounded-lg w-1/3"
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
                                                                    className="border px-3 py-2 rounded-lg w-1/3"
                                                                />

                                                                {/* Date and Time Picker */}
                                                                <DatePicker
                                                                    selected={option.date}
                                                                    onChange={(date) => handlePaymentChange(idx, "date", date, date)}
                                                                    showTimeSelect
                                                                    dateFormat="Pp"
                                                                    className="border px-3 py-2 rounded-lg w-full"
                                                                    wrapperClassName="w-full z-60"
                                                                />
                                                            
                                                                {/* Remove Button (Only for index > 0) */}
                                                                {idx > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleRemovePayment(option, idx);
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
                                            )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-4">
                                        <div className="border p-4 rounded-lg shadow-md bg-gray-100">
                                            <h3 className="text-lg font-semibold mb-4 text-center">Summary</h3>
                                            
                                            <div className="flex justify-between mb-2">
                                                <span className="text-blue-600"><strong>Service Price:</strong></span>
                                                <span className="text-right">{formatPrice(servicePrice)}</span>
                                            </div>

                                            <div className="flex justify-between mb-2">
                                                <span className="text-indigo-600"><strong>VAT (12%):</strong></span>
                                                <span className="text-right">{formatPrice(serviceVat)}</span>
                                            </div>

                                            <div className="flex justify-between mb-2">
                                                <span className="text-red-600"><strong>Less Discount:</strong></span>
                                                <span className="text-right">{formatPrice(discount)}</span>
                                            </div>

                                            <div className="flex justify-between mb-2">
                                                <span><strong>Amount to Pay:</strong></span>
                                                <span className="text-right">{formatPrice(amountToPaid)}</span>
                                            </div>

                                            <div className="flex justify-between mb-2">
                                                <span className="text-green-600"><strong>Total Paid:</strong></span>
                                                <span className="text-right">{formatPrice(paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0))}</span>
                                            </div>

                                            {paymentStatus > 1 && (
                                                <div className="flex justify-between mb-2">
                                                    <p>
                                                        <strong>Change:</strong>
                                                    </p>
                                                    <p className={`${amountToPaid - paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) > 0 ? 'text-red-600' : 'text-green-600'} text-right`}>
                                                        {formatPrice(paymentOptions.reduce((sum, option) => sum + (parseFloat(option.amount_paid) || 0), 0) - amountToPaid)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium mt-2">Remarks:</label>
                                            <div className="relative">
                                                <textarea
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    className="w-full p-2 border rounded resize-none"
                                                    placeholder="Enter remarks about the transaction of service..."
                                                    rows={4}
                                                ></textarea>
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

                {isTransactionPayModalOpen && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                            {/* Header */}
                            <div className="flex justify-between mt-4">
                                <h2 className="text-xl font-semibold">
                                    Payment Transaction
                                </h2>
                                <button 
                                    onClick={handleTransactionPayModalClose} 
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mt-4">
                                <div>
                                    <label>Status: </label>
                                    <span className={`text-${transactionInfo.payment_status?.color}-800`}>
                                        {transactionInfo.payment_status?.name}
                                    </span>
                                </div>
                                <div>
                                    <label>Total Paid: </label> 
                                    <span className="text-green-800">
                                        {Number(transactionInfo.paid) === 0 ? ' -' : formatPrice(transactionInfo.paid)}
                                    </span>
                                </div>
                                {transactionInfo.remaining > 0 && (
                                    <div>
                                        <label>Remaining Amount: </label> 
                                        <span className="text-red-600">
                                            {Number(transactionInfo.remaining) === 0 ? ' -' : formatPrice(transactionInfo.remaining)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {(Number(transactionInfo.remaining) > 0 || transactionInfo.payment_status_id != 3)  && (
                                <div>
                                    {isNewPayment ? (
                                        <div className="mt-2 flex gap-2 mb-2 items-center">
                                            <div className="space-y-4 border px-3 py-2 rounded-lg w-2/3">
                                                <div className="w-full">
                                                    <label>To Pay</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Amount to be Paid"
                                                        value={newPayment.amount}
                                                        onChange={(e) => handleNewPaymentChange("amount", e.target.value, e.target.value)}
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                    />
                                                </div>

                                                <div className="flex gap-2 mb-2 items-center">
                                                    <select
                                                        value={JSON.stringify({ payment_option_id: newPayment.payment_option_id, payment_option_name: newPayment.payment_option_name })}
                                                        onChange={(e) => {
                                                            const selectedValue = JSON.parse(e.target.value);
                                                            handleNewPaymentChange("payment_option_name", selectedValue.payment_option_id, selectedValue.payment_option_name);
                                                        }}
                                                        className="border px-3 py-2 rounded-lg w-1/3"
                                                    >
                                                        {availablePaymentOptions.map((payment) => (
                                                            <option key={payment.id} value={JSON.stringify({ payment_option_id: payment.id, payment_option_name: payment.name })}>
                                                                {payment.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="number"
                                                        placeholder="Amount Paid"
                                                        value={newPayment.amount_paid}
                                                        onChange={(e) => handleNewPaymentChange("amount_paid", e.target.value, e.target.value)}
                                                        className="border px-3 py-2 rounded-lg w-1/3"
                                                    />

                                                    <DatePicker
                                                        selected={newPayment.payment_date}
                                                        onChange={(date) => handleNewPaymentChange("date", date, date)}
                                                        showTimeSelect
                                                        dateFormat="Pp"
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                        wrapperClassName="w-full z-60"
                                                    />
                                                </div>

                                                <div className="flex gap-2 mb-2 items-center">
                                                    <button
                                                        onClick={() => {
                                                            handleSaveClick(newPayment,null);
                                                        }}
                                                        className="flex items-center gap-2 bg-green-600 text-sm text-white px-4 py-2 rounded-lg shadow w-1/2 hover:text-green-800 transition"
                                                    >
                                                        <span><Save size={16} /></span> Save
                                                    </button>
                                                
                                                    <button
                                                        onClick={handleCancelNewPayment}
                                                        className="flex items-center gap-2 bg-red-600 text-sm text-white px-4 py-2 rounded-lg shadow w-1/2 hover:text-red-800 transition"
                                                    >
                                                        <span><X size={16} /></span> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="border p-4 rounded-lg shadow-md bg-gray-100 w-1/3">
                                                <h3 className="text-lg font-semibold mb-4 text-center">Summary</h3>
                                                    
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-blue-600"><strong>To Pay:</strong></span>
                                                    <span className="text-right">{formatPrice(newPayment.amount)}</span>
                                                </div>

                                                <div className="flex justify-between mb-2">
                                                    <span className="text-green-600"><strong>Paid:</strong></span>
                                                    <span className="text-right">{formatPrice(newPayment.amount_paid)}</span>
                                                </div>

                                                <div className="flex justify-between mb-2">
                                                    <p>
                                                        <strong>Change:</strong>
                                                    </p>
                                                    <p className={`${newPayment.change < 0 ? 'text-red-600' : 'text-green-600'} text-right`}>
                                                        {formatPrice(newPayment.change)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleNewPayment}
                                                className="flex items-center gap-2 bg-blue-600 text-sm text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                                            >
                                                <Plus size={18} /> New Payment
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-700">
                                            <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Type of Payment</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionPayments?.length > 0 ? (
                                            transactionPayments.map((transactionPayment, idx) => {

                                                const paymentDate = new Date(transactionPayment.payment_date);
                                                const isEditing = editingRow === idx;

                                                return (
                                                    <tr key={transactionPayment.id}>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {isEditing ? (
                                                                <DatePicker
                                                                    selected={paymentDate}
                                                                    onChange={(date) => handleTransactionPaymentChange(idx, "payment_date", date, date)}
                                                                    showTimeSelect
                                                                    dateFormat="Pp"
                                                                    className="border px-3 py-2 rounded-lg w-full"
                                                                    wrapperClassName="w-full z-60"
                                                                />
                                                            ) : (
                                                                formatDateTime(transactionPayment.payment_date)
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {isEditing ? (
                                                                <select
                                                                    value={JSON.stringify({ payment_option_id: transactionPayment.payment_option_id, payment_option_name: transactionPayment.payment_option_name })}
                                                                    onChange={(e) => {
                                                                        const selectedValue = JSON.parse(e.target.value);
                                                                        handleTransactionPaymentChange(idx, "payment_option_name", selectedValue.payment_option_id, selectedValue.payment_option_name);
                                                                    }}
                                                                    className="border px-3 py-2 rounded-lg w-full"
                                                                >
                                                                    {availablePaymentOptions.map((payment) => (
                                                                        <option key={payment.id} value={JSON.stringify({ payment_option_id: payment.id, payment_option_name: payment.name })}>
                                                                            {payment.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                transactionPayment.payment_option_name
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    placeholder="Amount Paid"
                                                                    value={transactionPayment.amount}
                                                                    onChange={(e) => handleTransactionPaymentChange(idx, "amount", e.target.value, e.target.value)}
                                                                    className="border px-3 py-2 rounded-lg w-full"
                                                                />
                                                            ) : (
                                                                formatPrice(transactionPayment.amount)
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                                            <button 
                                                                onClick={() => isEditing ? handleSaveClick(transactionPayment, idx) : handleEditClick(idx)}
                                                                className={`flex items-center gap-1 ${isEditing ? "text-green-600 hover:text-green-800 hover:underline" : "text-blue-600 hover:text-blue-800 hover:underline"}`}
                                                            >
                                                                {isEditing ? (
                                                                    <span><Save size={16} /></span>
                                                                ) : (
                                                                    <span><Edit size={16} /></span>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                                    No Payment found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {isStatusModalOpen && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-xs w-full relative">
                            {/* Header */}
                            <div className="flex justify-between mt-4">
                                <h2 className="text-xl font-semibold">
                                    Service Status
                                </h2>
                                <button 
                                    onClick={handleStatusModalClose} 
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mt-4 w-full">
                                <label className="block text-sm font-medium text-gray-700">Status:</label>
                                <select
                                    value={serviceStatus}
                                    onChange={(e) => setServiceStatus(e.target.value)}
                                    className="border py-2 rounded-lg w-full"
                                >
                                    {serviceStatusesOptions.map((option) => (
                                         <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 w-full">
                                <label className="block text-sm font-medium text-gray-700">Start of Service:</label>
                                <DatePicker
                                    selected={serviceStartDate}
                                    onChange={(date) => setServiceStartDate(date)}
                                    isClearable
                                    className="w-full border px-3 py-2 rounded-lg"
                                    wrapperClassName="w-full z-60"
                                />
                            </div>

                            <div className="mt-4 w-full">
                                <label className="block text-sm font-medium text-gray-700">Date Finished:</label>
                                <DatePicker
                                    selected={serviceDateFinished}
                                    onChange={(date) => setServiceDateFinished(date)}
                                    isClearable
                                    className="w-full border px-3 py-2 rounded-lg"
                                    wrapperClassName="w-full z-60"
                                />
                            </div>

                            <div className="mt-4 w-full">
                                <label className="block text-sm font-medium text-gray-700">Date Out:</label>
                                <DatePicker
                                    selected={serviceDateOut}
                                    onChange={(date) => setServiceDateOut(date)}
                                    isClearable
                                    className="w-full border px-3 py-2 rounded-lg"
                                    wrapperClassName="w-full z-60"
                                />
                            </div>

                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={handleStatusModalClose} 
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleServiceStatusSubmit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );

};

export default TransactionTransactions;