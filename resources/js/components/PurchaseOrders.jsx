import Layout from "./Layout";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Edit, X, Clipboard, Circle, PrinterIcon, Package, PackageCheck, PackagePlus, Wallet, XCircle, RotateCcw, PieChart, CheckCircle, Save } from "lucide-react";
import moment from "moment";
import Swal from 'sweetalert2';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PurchaseOrders = () => {
    const [purchaseOrdersList, setPurchaseOrdersList] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
    const [isManagePurchaseOrderModal, setIsManagePurchaseOrderModal] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [filterStatus, setFilterStatus] = useState("All");
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [productsSelected, setProductsSelected] = useState([]);
    const [showProductSelection, setShowProductSelection] = useState(false);
    const [purchaseOrderStatuses, setPurchaseOrderStatuses] = useState([]);
    const [paymentStatuses, setPaymentStatuses] = useState([]);
    const [printData, setPrintData] = useState([]);
    const [poStatuses, setPoStatuses] = useState([]);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [availablePaymentOptions, setAvailablePaymentOptions] = useState([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isTransactionPayModalOpen, setIsTransactionPayModalOpen] = useState(false);
    const [isNewPayment, setIsNewPayment] = useState(false);    
    const [transactionPayments, setTransactionPayments] = useState(false);
    const [newPayment, setNewPayment] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const didFetch = useRef(false);
    const [poFormData, setPoFormData] = useState({        
        poId: null,
        code: null,
        supplierId: null,
        supplierName: null,
        dateTime: new Date(),
        remarks: "",
        productId: null,
        productName: "",
        productCost: 0,
        productQty: 1,
        productTotal: 0,
        products: [],
    });

    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
    }, []);

    useEffect(() => {
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

                const purchaseOrderStatusesResponse = await axios.get("/api/purchase-orders/statuses", {
                    params: {
                        start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                        end_date: endDate ? endDate.toISOString().split("T")[0] : null
                    },
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (purchaseOrderStatusesResponse.data.success) {
                    const statuses = purchaseOrderStatusesResponse.data.data;
                    setPurchaseOrderStatuses(statuses);
                } else {
                    toastr.error("Failed to load service statuses.");
                }

                const paymentStatusesResponse = await axios.get("/api/purchase-orders/payments", {
                    params: {
                        start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                        end_date: endDate ? endDate.toISOString().split("T")[0] : null
                    },
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (paymentStatusesResponse.data.success) {
                    const statuses = paymentStatusesResponse.data.data;
                    setPaymentStatuses(statuses);
                } else {
                    toastr.error("Failed to load service statuses.");
                }
            } catch (error) {
                toastr.error("Can't fetch data. Please refresh the page.");
            }
        };
        fetchData();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchPurchaseOrders(filterStatus);
    }, [search, page, dateRange, filterStatus, sortColumn, sortOrder]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchPurchaseOrders = async (filterStatus) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/purchase-orders`, {
                params: {
                    search,
                    page,
                    filterStatus: filterStatus,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null,
                    sort_column: sortColumn, 
                    sort_order: sortOrder,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setPurchaseOrdersList(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            
        }
    };

    const handleSort = (column) => {
        const newSortOrder = 
            sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    
        setSortColumn(column);
        setSortOrder(newSortOrder);
    };

    const handleSelectedPoStatus = (poStatus) => {
        setFilterStatus(poStatus);
        setPage(1);
        fetchPurchaseOrders(poStatus);
    };

    const handleOpenPurchaseOrderModal = (po) => {
        setShowProductSelection(false);
        if(po==null){
            setPoFormData(prevData => ({
                ...prevData,
                poId: null
            }));
        }else{
            const parsedDate = new Date(po.date_time_ordered);
            setPoFormData({
                poId: po.id,
                supplierId: po.supplier_id,
                supplierName: po.supplier_info?.name,
                dateTime: parsedDate,
                remarks: po.remarks,
                productId: null,
                productName: "",
                productCost: 0,
                productQty: 1,
                productTotal: 0,
                products: po.products.map(product => ({
                    poProductId: product.id, 
                    productId: product.product_id, 
                    productName: product.product_info?.name_variant,
                    productCost: product.cost,
                    productQty: product.qty,
                    productTotal: product.total
                }))
            });
        }
        setIsPurchaseOrderModalOpen(true);
    };

    const handleClosePurchaseOrderModal = () => {
        setPoFormData({
            poId: null,
            code: null,
            supplierId: null,
            supplierName: null,
            dateTime: new Date(),
            remarks: "",
            productId: null,
            productName: "",
            productCost: 0,
            productQty: 1,
            productTotal: 0,
            products: [],
        });
        setIsPurchaseOrderModalOpen(false);
        setShowProductSelection(false);
    };

    const handleSupplierSearch = async (e) => {
        const search = e.target.value;
        setPoFormData(prevData => ({
            ...prevData,
            supplierName: search
        }));
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-suppliers", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setSuppliers(response.data);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setSuppliers([]);
        }
    };

    const handleProductSearch = async (e) => {
        const search = e.target.value;
        setPoFormData(prevData => ({
            ...prevData,
            productName: search
        }));
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-products", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setProducts(response.data);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setProducts([]);
        }
    };

    const handleSelectSupplier = (supplier) => {
        setPoFormData(prevData => ({
            ...prevData,
            supplierId: supplier.id,
            supplierName: supplier.name
        }));
        setSuppliers([]);
    };

    const handleSelectProduct = (product) => {
        setPoFormData(prevData => ({
            ...prevData,
            productId: product.id,
            productName: product.name_variant,
            productCost: product.cost,
            productQty: 1,
            productTotal: product.cost * 1
        }));
        setProducts([]);
    };

    const handleChangeProduct = (e) => {
        const { name, value } = e.target;
        const numericValue = name === "productCost" || name === "productQty" ? parseFloat(value) : value;
        setPoFormData(prevData => {
            const updatedData = {
                ...prevData,
                [name]: numericValue
            };
    
            const productTotal = updatedData.productCost * updatedData.productQty;
    
            return {
                ...updatedData,
                productTotal: productTotal 
            };
        });
    };

    const handleAddProduct = () => {
        if(poFormData.productId==null){
            toastr.error("Error! Please select a product.");
            return;
        }
        setPoFormData(prevData => {
            const newProduct = {
                poProductId: null,
                productId: prevData.productId,
                productName: prevData.productName,
                productCost: prevData.productCost,
                productQty: prevData.productQty,
                productTotal: prevData.productTotal,
                productCostReceived: prevData.productCost,
                productQtyReceived: prevData.productQty,
                productTotalReceived: prevData.productTotal,
                productStatusId: 1,
            };
    
            return {
                ...prevData,
                products: [
                    ...prevData.products,
                    newProduct
                ],
                
                productId: null,
                productName: "",
                productCost: 0,
                productQty: 1,
                productTotal: 0
            };
        });
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!poFormData.supplierId) {
            toastr.error("Please select supplier!");
            return;
        }

        if (poFormData.products.length <= 0) {
            toastr.error("Please select atleast 1 product to order!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/purchase-orders/manage`, 
                poFormData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setPoFormData({
                    poId: null,
                    code: null,
                    supplierId: null,
                    supplierName: null,
                    dateTime: new Date(),
                    remarks: "",
                    productId: null,
                    productName: "",
                    productCost: 0,
                    productQty: 1,
                    productTotal: 0,
                    products: [],
                });
                setIsPurchaseOrderModalOpen(false);
                setShowProductSelection(false);
                fetchPurchaseOrders();
            }else{
                toastr.error("Error! There is something wrong in saving purchase orders.");
            }
        } catch (error) {
            toastr.error("Error!", error.response?.data);
        }

    };

    const handleRemoveProduct = async (product, index) => {
        Swal.fire({
            title: `Remove ${product.productName}?`,
            text: `Are you sure you want to remove "${product.productName}" costed at ${product.productCost}? This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                if(product.poProductId!=null){
                    try {
                        const authToken = localStorage.getItem("token");
                        const response = await axios.get("/api/purchase-orders/removeProduct", {
                            params: { id: product.poProductId },
                            headers: { Authorization: `Bearer ${authToken}` },
                        });
                        if (response.data.message === 'Product deleted successfully.') {
                            setPoFormData(prevData => ({
                                ...prevData,
                                products: prevData.products.filter((_, i) => i !== index)
                            }));
                            fetchPurchaseOrders();
                            Swal.fire("Removed!", `"${product.productName}" has been removed.`, "success");
                        } else {
                            Swal.fire("Error", response.data.message, "error");
                        }
                    } catch (error) {
                        Swal.fire("Error", "An error occurred while removing the product.", "error");
                    }
                }else{
                    setPoFormData(prevData => ({
                        ...prevData,
                        products: prevData.products.filter((_, i) => i !== index)
                    }));
                    Swal.fire("Removed!", `"${product.productName}" has been removed.`, "success");
                }
            }
        });
    };

    const handleCloseManagePurchaseOrderModal = () => {
        setPoFormData({
            poId: null,
            code: null,
            supplierId: null,
            supplierName: null,
            dateTime: new Date(),
            remarks: "",
            productId: null,
            productName: "",
            productCost: 0,
            productQty: 1,
            productTotal: 0,
            products: [],
        });
        setIsManagePurchaseOrderModal(false);
    };

    const handleManagePurchaseOrderModal = (po) => {
        const parsedDate = new Date(po.date_time_ordered).toISOString();
        const parsedDateReceived = po.date_time_received ? new Date(po.date_time_received) : new Date();
        setPoFormData({
            poId: po.id,
            code: po.code,
            statusId: po.status_id,
            statusName: po.status_info?.name,
            statusColor: po.status_info?.color,
            supplierId: po.supplier_id,
            supplierName: po.supplier_info?.name,
            dateTime: parsedDate,
            dateTimeReceived: parsedDateReceived,
            remarks: po.remarks,
            productId: null,
            productName: "",
            productCost: 0,
            productQty: 1,
            productTotal: 0,
            products: po.products.map(product => ({
                poProductId: product.id, 
                productId: product.product_id, 
                productName: product.product_info.name,
                productCost: product.cost,
                productQty: product.qty,
                productTotal: product.total,
                productCostReceived: product.cost_received>0 ? product.cost_received : product.cost,
                productQtyReceived: product.qty_received>0 ? product.qty_received : product.qty,
                productTotalReceived: product.total_received>0 ? product.total_received : product.total,
                productStatusId: product.status_id
            }))
        });
        setShowProductSelection(false);
        setIsManagePurchaseOrderModal(true);        
    };

    const handleChangeProductReceived = (e, index) => {
        const { name, value } = e.target;
        const numericValue = name === "productCostReceived" || name === "productQtyReceived" ? parseFloat(value) : value;
        setPoFormData(prevData => {
            const updatedProducts = prevData.products.map((product, i) => {
                if (i === index) {
                    const updatedProduct = {
                        ...product,
                        [name]: numericValue
                    };
    
                    const productTotal = updatedProduct.productCostReceived * updatedProduct.productQtyReceived;
                    return {
                        ...updatedProduct,
                        productTotalReceived: productTotal
                    };
                }
                return product; 
            });
    
            return {
                ...prevData,
                products: updatedProducts 
            };
        });
    };

    const handleSubmitManagePurchaseOrder = async (e) => {
        e.preventDefault();

        if (!poFormData.poId) {
            toastr.error("Error! Please select purchase order..");
            return;
        }

        if (poFormData.products.length <= 0) {
            toastr.error("Please select atleast 1 product to order!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/purchase-orders/manageStatus`, 
                poFormData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setIsManagePurchaseOrderModal(false);
                setShowProductSelection(false);
                fetchPurchaseOrders();
            }else{
                toastr.error("Error! There is something wrong in saving purchase orders.");
            }
        } catch (error) {
            toastr.error("Error!", error.response?.data);
        }
    };

    const handlePrintPurchaseOrder = (po) => {
        setPrintData(po);
        const printWindow = window.open('', '', 'height=600,width=800');
    
        if (!printWindow) return;
    
        const doc = printWindow.document;
        doc.title = "Purchase Order - Rockfil Stainless Metal Works"; 
        doc.head.innerHTML += `<title>Purchase Order</title>`;
        const body = doc.createElement('body');
    
        // Create styles
        const style = doc.createElement('style');
        style.textContent = `
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border-bottom: 2px solid black; 
                padding-bottom: 10px; 
                gap: 15px;
            }
            .header img { width: 70px; height: auto; }
            .header .middle-logo { margin: 0 0px; }
            .header-text { text-align: left; line-height: 1.2; flex: 1; }
            .header-text h4 { text-align: left; margin: 0; font-size: 18px; }
            .header-text p { margin: 0px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 5px; border: 1px solid #000; text-align: left; font-size: 12px; }
            th { text-align: center; font-size: 14px; }
            h2, h4 { text-align: center; }
            .supplier-date-container { 
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 3px;
                margin-top: 0px;
                align-items: start;
                font-size: 14px;
            }
            .supplier {
                text-align: left;
                margin-bottom: 0px;
                padding-bottom: 0px;
            }
            .date {
                text-align: right;
                align-self: start;
                margin-bottom: 0px;
            }
            .address {
                grid-column: span 2;
                text-align: left; 
                margin-top: 0px;
            }
            .underline {
                display: inline-block;
                border-bottom: 1px solid black;
            }
            .font-medium {
                font-weight: bold;
            }
            .no-border {
                border: none !important;
            }            
            .payment-status {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: 5px;
            }
            .payment-status span {
                display: inline-block;
                width: 150px;
                border-bottom: 1px solid black;
            }
            .cheque-receipt {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: -15px;
            }
            .cheque-receipt span {
                display: inline-block;
                width: 200px;
                border-bottom: 1px solid black;
            }
            .acknowledgment {
                font-style: italic;
                margin-top: -10px;
                font-size: 12px;
            }
            .signatories {
                display: flex;
                justify-content: space-between; /* Evenly distribute signatures */
                align-items: center;
                margin-top: 30px;
                font-size: 12px;
                gap: 20px; /* Adds spacing between each signature block */
            }

            .signature-block {
                text-align: center;
                flex: 1;
                position: relative;
            }
            .signature-line {
                display: block;
                width: 80%; /* Controls the length of the underline */
                border-top: 1px solid black; /* Creates the underline */
                margin: 0 auto 5px auto; /* Centers the line */
                height: 0px; /* Adds spacing between the line and text */
            }
            .signature-block p {
                margin: 0;
            }
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: #f8f9fa;
                text-align: center;
                padding: 10px 0;
                font-size: 12px;
                border-top: 1px solid #ccc;
            }
            .footer p {
                margin: 3px 0;
                font-size: 10px;
            }
        `;
        doc.head.appendChild(style);
    
        const header = doc.createElement('div');
        header.className = 'header';
    
        const leftLogo = doc.createElement('img');
        leftLogo.src = '/images/clstldev2.png'; 
        leftLogo.alt = 'Company Logo';

        const middleLogo = doc.createElement('img');
        middleLogo.src = '/images/rockfil.png';
        middleLogo.alt = 'Company Logo';
        middleLogo.className = 'middle-logo';
    
        const headerText = doc.createElement('div');
        headerText.className = 'header-text';
        headerText.innerHTML = `
            <h4>ROCKFIL STAINLESS METAL WORK DOT SUPPLY CORP.</h4>
            <p>Delgado Bldg., Brgy. 110 Utap, Diversion Rd., Tacloban City</p>
            <p>Telephone No: (053) 888 1003 | Mobile Nos: 0918-903-5706 / 0920-959-5734</p>
            <p>Email: rockfilstainless@gmail.com</p>
        `;
    
        header.appendChild(leftLogo);
        header.appendChild(middleLogo);
        header.appendChild(headerText);
    
        const title = doc.createElement('h4');
        title.innerText = 'Purchase Order';

        // Create supplier and date container
        const supplierDateContainer = doc.createElement('div');
        supplierDateContainer.className = 'supplier-date-container';

        // Supplier Section
        const supplierDiv = doc.createElement('div');
        supplierDiv.className = 'supplier';
        supplierDiv.innerHTML = `<span class="font-medium">Supplier: </span> <span class="underline">${po.supplier_info?.name}</span>`;

        // Date Section
        const dateDiv = doc.createElement('div');
        dateDiv.className = 'date';
        const currentDate = new Date().toLocaleDateString();
        dateDiv.innerHTML = `<span class="font-medium">Date: </span> <span class="underline">${moment(po.date_time_ordered).format("MMM D, YYYY") || currentDate}</span>`;

        // Address Section (below supplier & date)
        const addressDiv = doc.createElement('div');
        addressDiv.className = 'address';
        addressDiv.innerHTML = `<span class="font-medium">Address: </span> <span class="underline">${po.supplier_info?.address || ""}</span>`;

        // Append elements
        supplierDateContainer.appendChild(supplierDiv);
        supplierDateContainer.appendChild(dateDiv);
        supplierDateContainer.appendChild(addressDiv);

    
        const table = doc.createElement('table');
    
        const thead = doc.createElement('thead');
        const headerRow = doc.createElement('tr');
        const headers = ['#', 'Code', 'Description', 'Qty', 'Cost', 'Total'];
        const columnWidths = {
            '#': '5%',
            'Code': '10%',
            'Description': '40%',
            'Qty': '10%',
            'Cost': '15%',
            'Total': '20%'
        };
        headers.forEach(headerText => {
            const th = doc.createElement('th');
            th.innerText = headerText;
            th.style.width = columnWidths[headerText];
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        const totalRows = 22;

        const tbody = doc.createElement('tbody');
        po.products?.forEach((product, index) => {
            const row = doc.createElement('tr');
    
            const numberCell = doc.createElement('td');
            numberCell.style.textAlign = 'center';
            numberCell.innerText = index + 1;
            row.appendChild(numberCell);
    
            const codeCell = doc.createElement('td');
            codeCell.innerText = product.product_info?.code || 'N/A';
            row.appendChild(codeCell);
    
            const descriptionCell = doc.createElement('td');
            descriptionCell.innerText = product.product_info?.name_variant || 'No description';
            row.appendChild(descriptionCell);
    
            const qtyCell = doc.createElement('td');
            qtyCell.style.textAlign = 'center';
            const qtyValue = product.qty ? (Number(product.qty) % 1 === 0 ? Number(product.qty) : Number(product.qty).toFixed(2)) : '0';
            qtyCell.innerText = qtyValue;
            row.appendChild(qtyCell);
    
            const costCell = doc.createElement('td');
            costCell.style.textAlign = 'right';
            costCell.innerText = product.cost ? `${Number(product.cost).toFixed(2).toLocaleString()}` : '0.00';
            row.appendChild(costCell);
    
            const totalCell = doc.createElement('td');
            totalCell.style.textAlign = 'right';
            totalCell.innerText = product.total ? `${Number(product.total).toFixed(2).toLocaleString()}` : '0.00';
            row.appendChild(totalCell);
    
            tbody.appendChild(row);
        });

        const currentRows = po.products?.length || 0;
        for (let i = currentRows; i < totalRows; i++) {
            const emptyRow = doc.createElement('tr');

            for (let j = 0; j < 6; j++) {
                const emptyCell = doc.createElement('td');
                emptyCell.innerHTML = '&nbsp;';                
                emptyRow.appendChild(emptyCell);
            }

            tbody.appendChild(emptyRow);
        }

        table.appendChild(tbody);


        const tfoot = doc.createElement('tfoot');
        const totalRow = doc.createElement('tr');

        const emptyCells = 3; 
        for (let i = 0; i < emptyCells; i++) {
            const emptyCell = doc.createElement('td');
            emptyCell.className = 'no-border';
            totalRow.appendChild(emptyCell);
        }

        const labelCell = doc.createElement('td');
        labelCell.style.textAlign = 'right';
        labelCell.style.fontWeight = 'bold';
        labelCell.style.fontSize = '16px';
        labelCell.className = 'no-border';
        labelCell.colSpan = 2;
        labelCell.innerText = 'Overall Total:';
        totalRow.appendChild(labelCell);

        const totalAmountCell = doc.createElement('td');
        totalAmountCell.style.textAlign = 'right';
        totalAmountCell.style.fontWeight = 'bold';
        totalAmountCell.style.borderLeft  = '0px';
        totalAmountCell.style.borderRight = '0px';
        totalAmountCell.style.borderTop  = '0px';
        totalAmountCell.style.borderBottom = '3px double black';
        totalAmountCell.style.fontSize = '16px';
        const overallTotal = po.products?.reduce((sum, product) => sum + (Number(product.total) || 0), 0);
        totalAmountCell.innerText = overallTotal.toFixed(2).toLocaleString();
        totalRow.appendChild(totalAmountCell);

        tfoot.appendChild(totalRow);
        table.appendChild(tfoot);

        const footer = document.createElement('div');
        footer.innerHTML = `
            <div class="payment-status">
                <p><strong>PAYMENT STATUS:</strong> <span></span></p>
                <p><strong>W/ RECEIPT?:</strong> <span></span></p>
            </div>
            
            <div class="cheque-receipt">
                <p><strong>CHEQUE:</strong> <span></span></p>
                <p><strong>RECEIPT NO.:</strong> <span></span></p>
            </div>

            <div class="acknowledgment">
                <p><strong>Acknowledgment:</strong><br>
                By signing below, the Supplier agrees to fulfill the order as specified, and the Buyer acknowledges and agrees to the stated terms and conditions.</p>
            </div>

            <div class="signatories">
                <div class="signature-block">
                    <span class="signature-line"></span>
                    <p>Prepared by</p>
                </div>
                <div class="signature-block">
                    <span class="signature-line"></span>
                    <p>Checked by</p>
                </div>
                <div class="signature-block">
                    <span class="signature-line"></span>
                    <p>Approved by</p>
                </div>
                <div class="signature-block">
                    <span class="signature-line"></span>
                    <p>Supplier's Representative</p>
                </div>
            </div>


            
        `;

        // <div class="footer">
        //         <p><strong>ROCKFIL STAINLESS METAL WORK DOT SUPPLY CORP.</strong></p>
        //         <p>Delgado Bldg., Brgy. 110 Utap, Diversion Rd., Tacloban City</p>
        //         <p>Telephone No: (053) 888 1003 | Mobile Nos: 0918-903-5706 / 0920-959-5734</p>
        //         <p>Email: rockfilstainless@gmail.com</p>
        //     </div>

        body.appendChild(header);
        body.appendChild(title);
        body.appendChild(supplierDateContainer);
        body.appendChild(table);
        body.appendChild(footer);
        doc.body.replaceWith(body);
    
        let imagesLoaded = 0;
        const totalImages = 2; 

        function checkAndPrint() {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                printWindow.document.close();
                printWindow.print();
            }
        }

        leftLogo.onload = checkAndPrint;
        middleLogo.onload = checkAndPrint;

        setTimeout(() => {
            if (imagesLoaded < totalImages) {
                printWindow.document.close();
                printWindow.print();
            }
        }, 3000);
    };

    const handlePaymentSubmit = async (transactionPayment, idx) => {
        try {
            const formData = {
                payment: transactionPayment,
                newPayment: newPayment,
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/purchase-orders/payment`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setEditingRow(null);
                setIsNewPayment(false);
                const paymentData = response.data.data;
                setTransactionPayments(paymentData);
                fetchPurchaseOrders(filterStatus);
            }else{
                toastr.error("Error! There is something wrong in saving payment transaction.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the payment transaction.";
            toastr.error(errorMessage);
        }
    };

    const handlePayModal = (transaction) => {
        setIsTransactionPayModalOpen(true);
        setIsNewPayment(false);
        setTransactionPayments(transaction);
        setEditingRow(null);
    };

    const handleTransactionPayModalClose = () => {
        setIsTransactionPayModalOpen(false);
        setIsNewPayment(false);
        setTransactionPayments([]);
        setEditingRow(null);
    };

    const handleEditClick = (idx) => {
        setEditingRow(editingRow === idx ? null : idx);
    };

    const handleNewPayment = () => {
        const totalReceived = transactionPayments.products?.reduce(
            (sum, product) => sum + (parseFloat(product.total_received) || 0),
            0
        );
        const paymentsReceived = transactionPayments.payments?.reduce(
            (sum, payment) => sum + (parseFloat(payment.amount) || 0),
            0
        );
        const remainingAmount = Number(totalReceived)-Number(paymentsReceived);

        setNewPayment({
            purchase_order_id: transactionPayments.id,
            id: null,
            payment_option_id: 1,
            payment_option_name: "Cash",
            amount: remainingAmount,
            payment_date: new Date(),
            amount_paid: remainingAmount,
            change: 0,
            remarks: null,
        });
        setIsNewPayment(true);
    };

    
    const handleNewPaymentChange = (field, id, value) => {
        let updatedPayments = { ...newPayment };
    
        if (field === "payment_option_name") {
            updatedPayments[field] = value;
            updatedPayments["payment_option_id"] = id; 
        } else if (field === "date" || field === "remarks") {
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

    const handleTransactionPaymentChange = (idx, field, id, value) => {
        let updatedPayments = [...transactionPayments.payments];
    
        if (field === "payment_option_name") {
            updatedPayments[idx][field] = value;
            updatedPayments[idx]["payment_option_id"] = id; 
        } else if (field === "payment_date" || field === "remarks") {
            updatedPayments[idx][field] = value;
        } else {
            updatedPayments[idx][field] = parseFloat(value) || 0;
        }
        
        setTransactionPayments({
            ...transactionPayments,
            payments: updatedPayments,
        });
    };

    const handleCancelNewPayment = () => {
        setIsNewPayment(false);
    }

    const formatPrice = (price) => {
        if (Number(price) === 0) return ' -';
        return `₱${Number(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    const formatDateTime = (dateString) => {
        const formattedDate = moment(dateString);
    
        if (!formattedDate.isValid()) {
            return '';
        }
    
        return formattedDate.format("MMM D, YYYY h:mma");
    };
    
    const icons = [
        (props) => <PackageCheck size={20} {...props} />,
        (props) => <PackagePlus size={20} {...props} />,
        (props) => <XCircle size={20} {...props} />, 
        (props) => <RotateCcw size={20} {...props} />, 
    ];
        
    const colors = [
        "bg-blue-600",
        "bg-green-600",
        "bg-red-600",
        "bg-yellow-600",
    ];
        
    const textColors = [
        "text-blue-600", 
        "text-green-600", 
        "text-red-600", 
        "text-yellow-600",
    ];

    const paymentIcons = [
        (props) => <Circle size={20} {...props} />,
        (props) => <PieChart size={20} {...props} />,
        (props) => <CheckCircle size={20} {...props} />, 
    ];
        
    const paymentColors = [
        "bg-red-600",
        "bg-yellow-600",
        "bg-green-600",
    ];
        
    const paymentTextColors = [
        "text-red-600", 
        "text-yellow-600", 
        "text-green-600",
    ];

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Purchase Orders (PO)</h1>
                    <button
                        onClick={() => handleOpenPurchaseOrderModal(null)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New PO
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search purchase orders..."
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

                <div className="grid grid-cols-8 gap-6 mb-8">
                    <button
                        onClick={() => handleSelectedPoStatus("All")}
                        className={`flex flex-col items-center p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 ${
                            filterStatus === "All" ? "bg-blue-800 text-white" : "bg-white border border-gray-300"
                        }`}
                    >
                        <Package size={24} className={`${filterStatus === "All" ? "text-white" : "text-blue-800"}`} />
                        <span className="text-sm font-semibold">All</span>
                        <span className="text-lg font-bold">{purchaseOrderStatuses.reduce((sum, option) => sum + (option.purchase_orders_count || 0), 0)}</span>
                    </button>
                    
                    {purchaseOrderStatuses.map((poStatus, index) => {
                        const buttonColor = colors[index % colors.length];
                        const textColor = textColors[index % colors.length];
                        const Icon = icons[index % icons.length];

                        return (
                            <button
                                key={poStatus.id}
                                onClick={() => handleSelectedPoStatus(poStatus.id)}
                                className={`flex flex-col items-center p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    filterStatus === poStatus.id 
                                        ? `${buttonColor} text-white shadow-xl` 
                                        : `bg-white border border-gray-300 hover:bg-gray-100`
                                }`}
                            >
                                <Icon className={filterStatus === poStatus.id ? "text-white" : textColor} />
                                <span className="text-sm font-semibold">{poStatus.name}</span>
                                <span className="text-xl font-bold">
                                    {poStatus.purchase_orders_count}
                                </span>
                            </button>
                        );
                    })}

                    {paymentStatuses.map((paymentStatus, index) => {
                        const buttonColor = paymentColors[index % colors.length];
                        const textColor = paymentTextColors[index % colors.length];
                        const Icon = paymentIcons[index % icons.length];

                        return (
                            <button
                                key={paymentStatus.id}
                                onClick={() => handleSelectedPoStatus(`payment_status_id_${paymentStatus.id}`)}
                                className={`flex flex-col items-center p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    filterStatus === `payment_status_id_${paymentStatus.id}`
                                        ? `${buttonColor} text-white shadow-xl` 
                                        : `bg-white border border-gray-300 hover:bg-gray-100`
                                }`}
                            >
                                <Icon className={filterStatus === `payment_status_id_${paymentStatus.id}` ? "text-white" : textColor} />
                                <span className="text-sm font-semibold">{paymentStatus.name}</span>
                                <span className="text-xl font-bold">
                                    {paymentStatus.puchase_orders_payments_count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Sales Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("code")}
                                    rowSpan="2"
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
                                    onClick={() => handleSort("supplier_name")}
                                    rowSpan="2"
                                >
                                    <div className="flex items-center">
                                        <span>Supplier</span>
                                        <span className="ml-1">
                                            {sortColumn === "supplier_name" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2" style={{ minWidth: '250px' }}>Products</th>
                                <th className="border border-gray-300 px-4 py-2 text-center" colSpan="2">DateTime</th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("status_id")}
                                    rowSpan="2"
                                >
                                    <div className="flex items-center">
                                        <span>Status</span>
                                        <span className="ml-1">
                                            {sortColumn === "status_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("payment_status_id")}
                                    rowSpan="2"
                                >
                                    <div className="flex items-center">
                                        <span>Payments</span>
                                        <span className="ml-1">
                                            {sortColumn === "payment_status_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("remarks")}
                                    rowSpan="2"
                                >
                                    <div className="flex items-center">
                                        <span>Remarks</span>
                                        <span className="ml-1">
                                            {sortColumn === "remarks" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-center" rowSpan="2">Actions</th>
                            </tr>
                            <tr className="bg-gray-100 text-gray-700">
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("date_time_ordered")}
                                >
                                    <div className="flex items-center">
                                        <span>Ordered</span>
                                        <span className="ml-1">
                                            {sortColumn === "date_time_ordered" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th
                                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                    onClick={() => handleSort("date_time_received")}
                                >
                                    <div className="flex items-center">
                                        <span>Received</span>
                                        <span className="ml-1">
                                            {sortColumn === "date_time_received" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrdersList.length > 0 ? (
                                purchaseOrdersList.map((po, index) => {
                                    const totalReceived = po.products?.reduce(
                                        (sum, product) => sum + (parseFloat(product.total_received) || 0),
                                        0
                                    );
                                    const paymentsReceived = po.payments?.reduce(
                                        (sum, payment) => sum + (parseFloat(payment.amount) || 0),
                                        0
                                    );
                                    const remainingAmount = Number(totalReceived)-Number(paymentsReceived);
                                    const paymentRemarks = po.products
                                    return (
                                        <tr key={po.id}>
                                            <td className="border border-gray-300 px-4 py-2">{po.code}</td>
                                            <td className="border border-gray-300 px-4 py-2">{po.supplier_name}</td>
                                            <td className="border border-gray-300 px-1 py-1 relative">
                                                {po.products?.length > 0 && (
                                                    <div className="max-h-80 overflow-y-auto">
                                                        {po.products.map((product, index) => (
                                                            <div 
                                                                key={index} 
                                                                className="w-full bg-white border rounded-lg shadow-lg p-2 relative"
                                                            >
                                                                <span className="text-gray-800">
                                                                    {product.product_info?.name_variant}
                                                                </span>
                                                                <div className="text-sm">
                                                                    <div>
                                                                        <span className="font-medium">Qty:</span> {product.qty}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Total:</span> ₱{Number((product.total)).toFixed(2).toLocaleString()}
                                                                    </div>
                                                                    <div>
                                                                        Status: 
                                                                        <span className={`font-medium text-${product.status_info?.color}-600`}>
                                                                            {product.status_info?.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {moment(po.date_time_ordered).format("MMM D, YY h:mma")}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {moment(po.date_time_received).isValid() ? moment(po.date_time_received).format("MMM D, YY h:mma") : ""}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`font-medium text-${po.status_info?.color}-600`}>
                                                    {po.status_info?.name}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`font-medium text-${po.payment_status_info?.color}-600`}>
                                                    {po.payment_status_info?.name}
                                                </span>
                                                {Number(paymentsReceived) > 0 && (
                                                    <div className="text-sm">
                                                        <div>
                                                            <span className="font-medium">Paid:</span> 
                                                            <span className="text-green-800">
                                                                {Number(paymentsReceived) === 0 ? ' -' : formatPrice(paymentsReceived)}
                                                            </span>
                                                        </div>
                                                        {remainingAmount > 0 && (
                                                            <div>
                                                                <span className="font-medium">Remaining:</span> 
                                                                <span className="text-red-800">
                                                                    {remainingAmount === 0 ? ' -' : formatPrice(remainingAmount)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {po.payments?.length > 0 ? (
                                                            po.payments.map((payment, index) => (
                                                            <div key={index}>
                                                                {payment.remarks}
                                                            </div>
                                                            ))
                                                        ) : (
                                                            ""
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">{po.remarks}</td>
                                            <td className="border border-gray-300 px-4 py-2 gap-2">
                                                <button 
                                                    onClick={() => handleOpenPurchaseOrderModal(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-blue-500
                                                            rounded-lg shadow transition duration-200
                                                            hover:text-white hover:border hover:border-blue-500 hover:bg-blue-500"
                                                >
                                                    <Edit size={14} />
                                                    <span className="text-sm">Edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleManagePurchaseOrderModal(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-blue-700
                                                        rounded-lg shadow transition duration-200
                                                        hover:text-white hover:border hover:border-blue-700 hover:bg-blue-700"
                                                >
                                                    <Clipboard size={14} />
                                                    <span className="text-sm">Manage</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePayModal(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-green-600
                                                        rounded-lg shadow transition duration-200
                                                        hover:text-white hover:border hover:border-green-600 hover:bg-green-600"
                                                >
                                                    <Wallet size={14} />
                                                    <span className="text-sm">Payment</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePrintPurchaseOrder(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-blue-900
                                                        rounded-lg shadow transition duration-200
                                                        hover:text-white hover:border hover:border-blue-900 hover:bg-blue-900"
                                                >
                                                    <PrinterIcon size={14} />
                                                    <span className="text-sm">Print</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Purchase Orders (PO) found.
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

            {isPurchaseOrderModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                {poFormData.poId ? 'Edit Purchase Order (PO)' : 'New Purchase Order (PO)'}
                            </h2>
                            <button 
                                onClick={() => handleClosePurchaseOrderModal()} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="mt-4">
                            {/* PurchaseOrder Name with Suggestions */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium">Supplier</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={poFormData.supplierName}
                                            onChange={handleSupplierSearch}
                                            className="w-full p-2 border rounded"
                                            placeholder="Type to search..."
                                        />
                                        {suppliers.length > 0 && (
                                            <ul className="absolute bg-white border rounded w-full mt-1 shadow-lg max-h-40 overflow-auto z-50">
                                                {suppliers.map((supplier) => (
                                                    <li
                                                        key={supplier.id}
                                                        onClick={() => handleSelectSupplier(supplier)}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {supplier.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Date Time</label>
                                    <DatePicker
                                        selected={poFormData.dateTime}
                                        onChange={(date) => setPoFormData(prevData => ({
                                                ...prevData,
                                                dateTime: date
                                            }))
                                        }
                                        showTimeSelect
                                        dateFormat="Pp"
                                        className="border px-3 py-2 rounded-lg w-full"
                                        wrapperClassName="w-full z-60"
                                    />
                                </div>
                            </div>
                            <div className="mt-2">
                                <label className="block text-sm font-medium mt-2">Remarks:</label>
                                <div className="relative">
                                    <textarea
                                        value={poFormData.remarks}
                                        onChange={(e) => setPoFormData(prevData => ({
                                                ...prevData,
                                                remarks: e.target.value
                                            }))
                                        }
                                        className="w-full p-2 border rounded resize-none"
                                        placeholder="Enter remarks about the purchase order..."
                                        rows={2}
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="w-full mt-4">
                                {/* Product Search & Selection Section */}
                                {showProductSelection ? (
                                    <div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Product Search & Selection */}
                                            <div className="col-span-2 w-full">
                                                <label className="block text-sm font-medium text-gray-700">Product:</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        placeholder="Search Product"
                                                        value={poFormData.productName}
                                                        onChange={handleProductSearch}
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                    />
                                                    {/* Dropdown */}
                                                    {products.length > 0 && (
                                                        <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                            {products.map((product) => (
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
                                                <label className="block text-sm font-medium text-gray-700">Cost:</label>
                                                <input 
                                                    type="number"
                                                    name="productCost"
                                                    value={poFormData.productCost}
                                                    onChange={handleChangeProduct}
                                                    className="border px-3 py-2 rounded-lg w-full"
                                                />
                                            </div>
                                            <div className="w-full">
                                                <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                                <input 
                                                    type="number"
                                                    name="productQty"
                                                    value={poFormData.productQty}
                                                    onChange={handleChangeProduct}
                                                    className="border px-3 py-2 rounded-lg w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 w-full flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowProductSelection(!showProductSelection)}
                                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                            >
                                               Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddProduct}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600 text-sm"
                                            >
                                                Add Product
                                            </button>                                            
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowProductSelection(!showProductSelection)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600 text-sm"
                                        >
                                           Add New Product
                                        </button>
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
                                            {poFormData.products?.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="border px-4 py-2">{product.productName}</td>
                                                    <td className="border px-4 py-2">₱{Number((product.productCost)).toFixed(2).toLocaleString()}</td>
                                                    <td className="border px-4 py-2">{product.productQty}</td>
                                                    <td className="border px-4 py-2">₱{Number((product.productTotal)).toFixed(2).toLocaleString()}</td>
                                                    <td className="border px-4 py-2">
                                                    <button
                                                        type="button"
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
                          
                            <button
                                type="submit"
                                className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save Purchase Order
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isManagePurchaseOrderModal && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-5xl max-h-[90vh] overflow-y-auto w-full">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                Manage Purchase Order Status
                            </h2>
                            <button 
                                onClick={handleCloseManagePurchaseOrderModal} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div>
                                <label>Code: </label>
                                <span className="font-medium">
                                    {poFormData.code}
                                </span>
                            </div>
                            <div>
                                <label>Supplier: </label>
                                <span className="font-medium">
                                    {poFormData.supplierName}
                                </span>
                            </div>
                            <div>
                                <label>Ordered: </label>
                                <span className="font-medium">
                                    {moment(poFormData.dateTime).format("MMM D, YY h:mma")}
                                </span>
                            </div>
                            <div></div>
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-medium" style={{minWidth: '60px'}}>Received:</label>
                                <DatePicker
                                    selected={poFormData.dateTimeReceived}
                                    onChange={(date) => setPoFormData(prevData => ({
                                            ...prevData,
                                            dateTimeReceived: date
                                        }))
                                    }
                                    showTimeSelect
                                    dateFormat="Pp"
                                    className="border px-3 py-2 rounded-lg w-full"
                                    wrapperClassName="w-full z-60"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className={`font-medium text-${poFormData.statusColor}-600`} style={{minWidth: '50px'}}>Status: </label>
                                <select
                                    value={poFormData.statusId}
                                    onChange={(e) =>{ 
                                        const newStatusId = e.target.value;        
                                        setPoFormData(prevData => ({
                                            ...prevData,
                                            statusId: newStatusId
                                        }));
                                    }}
                                    className="border py-2 rounded-lg w-full"
                                >
                                    {purchaseOrderStatuses.map((status) => (
                                        <option key={status.id} value={status.id}>
                                            {status.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="w-full mt-4">
                                {/* Product Search & Selection Section */}
                                {showProductSelection ? (
                                    <div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Product Search & Selection */}
                                            <div className="col-span-2 w-full">
                                                <label className="block text-sm font-medium text-gray-700">Product:</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        placeholder="Search Product"
                                                        value={poFormData.productName}
                                                        onChange={handleProductSearch}
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                    />
                                                    {/* Dropdown */}
                                                    {products.length > 0 && (
                                                        <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                            {products.map((product) => (
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
                                                <label className="block text-sm font-medium text-gray-700">Cost:</label>
                                                <input
                                                    type="number"
                                                    name="productCost"
                                                    value={poFormData.productCost}
                                                    onChange={handleChangeProduct}
                                                    className="border px-3 py-2 rounded-lg w-full"
                                                />
                                            </div>
                                            <div className="w-full">
                                                <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                                <input 
                                                    type="number"
                                                    name="productQty"
                                                    value={poFormData.productQty}
                                                    onChange={handleChangeProduct}
                                                    className="border px-3 py-2 rounded-lg w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 w-full flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowProductSelection(!showProductSelection)}
                                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddProduct}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600 text-sm"
                                            >
                                                Add Product
                                            </button>                                            
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowProductSelection(!showProductSelection)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600 text-sm"
                                        >
                                            Add New Product
                                        </button>
                                    </div>
                                )}

                                <div className="mb-4 max-h-[50vh] overflow-y-auto relative">
                                    <table className="w-full mt-4 border border-gray-300 text-sm">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                            <th className="border px-4 py-2 text-left">Product Name</th>
                                            <th className="border px-4 py-2 text-left">Unit Cost</th>
                                            <th className="border px-4 py-2 text-left">Quantity</th>
                                            <th className="border px-4 py-2 text-left">Total</th>
                                            <th className="border px-4 py-2 text-left">Status</th>
                                            <th className="border px-4 py-2 text-left">Actions</th>
                                            </tr>
                                        </thead>  
                                        <tbody>
                                            {poFormData.products?.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="border px-4 py-2">{product.productName}</td>
                                                    <td className="border px-4 py-2">
                                                        ₱{Number((product.productCost)).toFixed(2).toLocaleString()}
                                                        <div className="w-full">
                                                            <label className="block text-sm font-medium text-gray-700">Received:</label>
                                                            <input 
                                                                type="number"
                                                                name="productCostReceived"
                                                                value={product.productCostReceived}
                                                                onChange={(e) => handleChangeProductReceived(e, index)}
                                                                className="border px-3 py-2 rounded-lg w-full"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="border px-4 py-2">
                                                        {product.productQty}
                                                        <div className="w-full">
                                                            <label className="block text-sm font-medium text-gray-700">Received:</label>
                                                            <input 
                                                                type="number"
                                                                name="productQtyReceived"
                                                                value={product.productQtyReceived}
                                                                onChange={(e) => handleChangeProductReceived(e, index)}
                                                                className="border px-3 py-2 rounded-lg w-full"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="border px-4 py-2">
                                                        ₱{Number((product.productTotal)).toFixed(2).toLocaleString()}
                                                        <div className="w-full">
                                                            <label className="block text-sm font-medium text-gray-700">Received:</label>
                                                            <span className="font-medium">
                                                                ₱{product.productTotalReceived}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="border px-4 py-2">
                                                        <select
                                                            value={product.productStatusId}
                                                            onChange={(e) =>{ 
                                                                const newStatusId = e.target.value;
        
                                                                setPoFormData(prevData => ({
                                                                    ...prevData,
                                                                    products: prevData.products.map((prod, i) =>
                                                                        i === index 
                                                                            ? {
                                                                                ...prod,
                                                                                productStatusId: newStatusId 
                                                                            }
                                                                            : prod
                                                                    )
                                                                }));
                                                            }}
                                                            className="border py-2 rounded-lg w-full"
                                                        >
                                                            {purchaseOrderStatuses.map((status) => (
                                                                <option key={status.id} value={status.id}>
                                                                    {status.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="border px-4 py-2">
                                                        <button
                                                            type="button"
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

                                <div>
                                <button
                                        type="button"
                                        onClick={handleSubmitManagePurchaseOrder}
                                        className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                    >
                                        Save
                                    </button>
                                </div>
                        </div>
                    </div>

                    <div id="printable" style={{ display: 'none' }}>
                        <h2>Purchase Order</h2>
                        <table border="1" cellPadding="10">
                        <thead>
                            <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* {printData.products?.map(product => (
                            <tr key={product.id}>
                                <td>{product.product_info?.name_variant}</td>
                            </tr>
                            ))} */}
                        </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isTransactionPayModalOpen && (() => {
                const totalReceived = transactionPayments.products?.reduce(
                    (sum, product) => sum + (parseFloat(product.total_received) || 0),
                    0
                );
                const paymentsReceived = transactionPayments.payments?.reduce(
                    (sum, payment) => sum + (parseFloat(payment.amount) || 0),
                    0
                );
                const remainingAmount = Number(totalReceived)-Number(paymentsReceived);
                return (
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
                                    <span className={`text-${transactionPayments.payment_status_info?.color}-800`}>
                                        {transactionPayments.payment_status_info?.name}
                                    </span>
                                </div>
                                <div>
                                    <label>Total Paid: </label> 
                                    <span className="text-green-800">

                                        {Number(paymentsReceived) === 0 ? ' -' : formatPrice(paymentsReceived)}
                                    </span>
                                </div>
                                <div>
                                    <label>Remaining Amount: </label> 
                                    <span className="text-red-600">
                                        {remainingAmount === 0 ? ' -' : formatPrice(remainingAmount)}
                                    </span>
                                </div>
                            </div>

                            {(remainingAmount > 0 || transactionPayments.payment_status_id != 3)  && (
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

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium mt-1">Remarks:</label>
                                                    <div className="relative">
                                                        <textarea
                                                            value={newPayment.remarks}
                                                            onChange={(e) => handleNewPaymentChange("remarks", e.target.value, e.target.value)}
                                                            className="w-full p-2 border rounded resize-none"
                                                            placeholder=""
                                                            rows={2}
                                                        ></textarea>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mb-2 items-center">
                                                    <button
                                                        onClick={() => {
                                                            handlePaymentSubmit(newPayment,null);
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
                                            <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionPayments.payments?.length > 0 ? (
                                            transactionPayments.payments?.map((transactionPayment, idx) => {

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
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {isEditing ? (
                                                                <textarea
                                                                    value={transactionPayment.remarks}
                                                                    onChange={(e) => handleTransactionPaymentChange(idx, "remarks", e.target.value, e.target.value)}
                                                                    className="w-full p-2 border rounded resize-none"
                                                                    placeholder="..."
                                                                    rows={2}
                                                                ></textarea>
                                                            ) : (
                                                                transactionPayment.remarks
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                                            <button 
                                                                onClick={() => isEditing ? handlePaymentSubmit(transactionPayment, idx) : handleEditClick(idx)}
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
                );
            })()}
        </Layout>
    );
};

export default PurchaseOrders;