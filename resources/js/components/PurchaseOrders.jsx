import Layout from "./Layout";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, X } from "lucide-react";
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
    const [suggestions, setSuggestions] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [filterStatus, setFilterStatus] = useState("All");

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!expenseName || !expenseAmount || expenseAmount <= 0 || !expenseDate) {
            toastr.error("Please input PurchaseOrder name and amount!");
            return;
        }

        try {            
            const formData = {
                name: expenseName,
                amount: expenseAmount,
                dateTime: expenseDate,
                remarks: expenseRemarks
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/purchaseOrders/store`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                fetchPurchaseOrders();
                setPurchaseOrderName("");
                setPurchaseOrderAmount("");
                setPurchaseOrderRemarks("");
                setIsPurchaseOrderModalOpen(false);
            }else{
                toastr.error("Error! There is something wrong in saving new expense.");
            }
        } catch (error) {
            toastr.error("Error!", error.response?.data);
        }

    };

    const handleDelete = (expenseId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then( async (result) => {
            if (result.isConfirmed) {
                
                try {
                    const authToken = localStorage.getItem("token");
                    const response = await axios.post("/api/purchaseOrders/delete",
                        { expenseId: expenseId },
                        {
                            headers: { Authorization: `Bearer ${authToken}` }
                        }
                    );
                    if (response.status === 200 || response.status === 201) {
                        Swal.fire("Deleted!", response.data.message, "success");

                        setPurchaseOrdersList((prevList) =>
                            prevList.filter((item) => item.id !== expenseId)
                        );
                    }else{
                        Swal.fire("Error!", "There was a problem", "success");
                        
                    }
                } catch (error) {
                    Swal.fire("Error!", "There was a problem", "error");
                }
            }
        });
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Purchase Orders (PO)</h1>
                    <button
                        onClick={() => setIsPurchaseOrderModalOpen(true)}
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
                                <th className="border border-gray-300 px-4 py-2 text-left" rowSpan="2">Products</th>
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
                                        <td className="border border-gray-300 px-4 py-2 relative">
                                            {po.products?.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto">
                                                    {po.products.map((product, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="w-full bg-white border rounded-lg shadow-lg mt-1 mb-2 relative"
                                                        >
                                                            <span className="text-gray-800">
                                                                {product.product_info?.name_variant}
                                                            </span>
                                                            <div className="text-sm">
                                                                <div>
                                                                    <span className="font-medium">Qty:</span>{product.qty}
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
                                        <td className="border border-gray-300 px-4 py-2">{po.status_info?.name}</td>
                                        <td className="border border-gray-300 px-4 py-2">{po.remarks}</td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                            <button 
                                                    onClick={() => handleDelete(po.id)}
                                                    className="flex items-center gap-2 px-3 py-1 text-white bg-red-600 border border-red-600 
                                                            rounded-lg shadow transition duration-200 
                                                            hover:bg-white hover:text-red-600 hover:border-red-600"
                                                >
                                                    <Trash size={16} />
                                                    {/* <span>Delete</span> */}
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
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">New Purchase Order (PO)</h2>
                            <button 
                                onClick={() => setIsPurchaseOrderModalOpen(false)} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="mt-4">
                            {/* PurchaseOrder Name with Suggestions */}
                            <label className="block text-sm font-medium">PurchaseOrder Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={expenseName}
                                    onChange={(e) => setPurchaseOrderName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Type to search..."
                                />
                                {suggestions.length > 0 && (
                                    <ul className="absolute bg-white border rounded w-full mt-1 shadow-lg max-h-40 overflow-auto z-50">
                                        {suggestions.map((name) => (
                                            <li
                                                key={name}
                                                // onClick={() => handleSelectPurchaseOrder(name)}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Amount */}
                            <label className="block mt-3 text-sm font-medium">Amount</label>
                            <input
                                type="number"
                                value={expenseAmount}
                                onChange={(e) => setPurchaseOrderAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter amount"
                            />

                            {/* Date */}
                            <label className="block mt-3 text-sm font-medium">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={expenseDate}
                                onChange={(e) => setPurchaseOrderDate(e.target.value)}
                                className="w-full p-2 border rounded"
                            />

                            {/* Remarks */}
                            <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                            <textarea 
                                value={expenseRemarks || ""}
                                onChange={(e) => setPurchaseOrderRemarks(e.target.value)}
                                className="mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows={3}
                                placeholder="Enter remarks here..."
                            ></textarea>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save PurchaseOrder
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PurchaseOrders;