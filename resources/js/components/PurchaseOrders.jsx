import Layout from "./Layout";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Edit, X, Clipboard, File, PrinterIcon } from "lucide-react";
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
    const [printData, setPrintData] = useState([]);
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
       const fetchData = async () => {
           try {
               const authToken = localStorage.getItem("token");

               const purchaseOrderStatusesResponse = await axios.get("/api/purchase-orders/statuses", {
                   headers: { Authorization: `Bearer ${authToken}` },
               });

               if (purchaseOrderStatusesResponse.data.success) {
                   const statuses = purchaseOrderStatusesResponse.data.data;
                   setPurchaseOrderStatuses(statuses);
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
        fetchPurchaseOrders();
    }, [search, page, dateRange, filterStatus]);

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
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setPurchaseOrdersList(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            
        }
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
                    productName: product.product_info.name,
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
                productCostReceived: product.cost,
                productQtyReceived: product.qty,
                productTotalReceived: product.total,
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

        // Create the HTML structure for the print content manually
        const body = printWindow.document.createElement('body');
        const title = printWindow.document.createElement('h2');
        title.innerText = 'Purchase Order';
        
        const table = printWindow.document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = printWindow.document.createElement('thead');
        const headerRow = printWindow.document.createElement('tr');
        const headers = ['Description', 'Quantity', 'Unit Price', 'Total'];
        headers.forEach(header => {
            const th = printWindow.document.createElement('th');
            th.style.padding = '5px';
            th.style.border = '1px solid #ddd';
            th.style.textAlign = 'center';
            th.innerText = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = printWindow.document.createElement('tbody');
        printData.products?.forEach(product => {
          const row = printWindow.document.createElement('tr');
        
          const descriptionCell = printWindow.document.createElement('td');
          descriptionCell.innerText = product.product_info?.name_variant;
          row.appendChild(descriptionCell);
        
        //   const quantityCell = printWindow.document.createElement('td');
        //   quantityCell.innerText = item.quantity;
        //   row.appendChild(quantityCell);
        
        //   const priceCell = printWindow.document.createElement('td');
        //   priceCell.innerText = item.price.toFixed(2);
        //   row.appendChild(priceCell);

        //   const totalCell = printWindow.document.createElement('td');
        //   totalCell.innerText = (item.quantity * item.price).toFixed(2);
        //   row.appendChild(totalCell);

          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        body.appendChild(title);
        body.appendChild(table);
        printWindow.document.body.appendChild(body);

        // Apply print styles
        const style = printWindow.document.createElement('style');
        style.innerText = `
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        h2 { text-align: center; }
        `;
        printWindow.document.head.appendChild(style);

        // Trigger the print dialog
        printWindow.document.close();
        printWindow.print();
    };

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

                {/* Sales Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2">Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2">Supplier</th>
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2" style={{ minWidth: '250px' }}>Products</th>
                                <th className="border border-gray-300 px-4 py-2 text-center" colSpan="2">DateTime</th>
                                <th className="border border-gray-300 px-4 py-2 text-center" rowSpan="2">Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2">Remarks</th>
                                <th className="border border-gray-300 px-4 py-2 text-center" rowSpan="2">Actions</th>
                            </tr>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-center">Ordered</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrdersList.length > 0 ? (
                                purchaseOrdersList.map((po, index) => (
                                    <tr key={po.id}>
                                        <td className="border border-gray-300 px-4 py-2">{po.code}</td>
                                        <td className="border border-gray-300 px-4 py-2">{po.supplier_info?.name}</td>
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
                                        <td className="border border-gray-300 px-4 py-2">{po.remarks}</td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                            <button 
                                                    onClick={() => handleOpenPurchaseOrderModal(po)}
                                                    className="flex items-center gap-1 px-1 py-1 text-white bg-blue-500 border border-blue-500 
                                                            rounded-lg shadow transition duration-200 
                                                            hover:bg-white hover:text-blue-500 hover:border-blue-500"
                                                >
                                                    <Edit size={14} />
                                                    <span className="text-sm">Edit</span>
                                            </button>
                                            <button 
                                                    onClick={() => handleManagePurchaseOrderModal(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-white bg-blue-700 border border-blue-700 
                                                            rounded-lg shadow transition duration-200 
                                                            hover:bg-white hover:text-blue-700 hover:border-blue-700"
                                                >
                                                    <Clipboard size={14} />
                                                    <span className="text-sm">Manage</span>
                                            </button>
                                            <button 
                                                    onClick={() => handlePrintPurchaseOrder(po)}
                                                    className="flex items-center gap-2 px-1 py-1 text-white bg-blue-900 border border-blue-900 
                                                            rounded-lg shadow transition duration-200 
                                                            hover:bg-white hover:text-blue-900 hover:border-blue-900"
                                                >
                                                    <PrinterIcon size={14} />
                                                    <span className="text-sm">Print</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
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
        </Layout>
    );
};

export default PurchaseOrders;