import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import ReactPaginate from "react-paginate";
import moment from "moment";
import { Eye, Plus, Trash, Package, RotateCcw, ShoppingBag, Repeat, AlertTriangle, XCircle } from "lucide-react";
import ReturnsNewModal from "./ReturnsNewModal";
import toastr from 'toastr';
import Swal from 'sweetalert2';

const Returns = () => {
    const [returnsList, setReturnsList] = useState([]); 
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);   
    const [search, setSearch] = useState("");    
    const [dateRange, setDateRange] = useState([null, null]); 
    const [startDate, endDate] = dateRange;
    const [returnsNewModalOpen, setReturnsNewModalOpen] = useState(false);
    const [returnOptions, setReturnOptions] = useState([]);
    const [selectedReturnOption, setSelectedReturnOption] = useState("all");     
    const [totalReturns, setTotalReturns] = useState(0);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const didFetch = useRef(false);

    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
        const authToken = localStorage.getItem("token");
        axios.get("/api/fetch-return-options",{
                headers: { Authorization: `Bearer ${authToken}` },
            }) 
            .then(response => {
                if (response.data.success) {
                    const options = response.data.data;
                    setReturnOptions(options);
                    
                    const total = options.reduce((sum, option) => sum + (option.returns_count || 0), 0);
                    setTotalReturns(total);

                } else {
                    toastr.error("Failed to load return options.");
                }
            })
            .catch(error => {

            });
    }, []);

    useEffect(() => {
        fetchReturnsList(selectedReturnOption);
    }, [search, page, selectedReturnOption, startDate, endDate, sortColumn, sortOrder]);

    const fetchReturnsList = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/returns`, {
                headers: { Authorization: `Bearer ${authToken}` },
                params: {
                    search: search,
                    page: page,
                    filter: filter,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : "",
                    end_date: endDate ? endDate.toISOString().split("T")[0] : "",
                    sort_column: sortColumn, 
                    sort_order: sortOrder,
                },
            });

            setReturnsList(response.data.data);
            setMeta(response.data.meta || {});
        } catch (error) {
        
        }
    };

    const handleSort = (column) => {
        const newSortOrder = 
            sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    
        setSortColumn(column);
        setSortOrder(newSortOrder);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };
    

    const handleSelectedReturnOption = (filterType) => {
        setSelectedReturnOption(filterType);
        setPage(1);
        fetchReturnsList(filterType);
    };

    const handleReturnDelete = (returnId) => {
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
                    const response = await axios.post("/api/returns/delete",
                        { return_id: returnId },
                        {
                            headers: { Authorization: `Bearer ${authToken}` }
                        }
                    );
                    if (response.status === 200 || response.status === 201) {
                        Swal.fire("Deleted!", response.data.message, "success");

                        setReturnsList((prevList) =>
                            prevList.filter((item) => item.id !== returnId)
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

    const colors = [
        "bg-blue-800", "bg-red-500",  "bg-purple-500", 
        "bg-yellow-500", "bg-green-500", "bg-pink-500"
    ];
    
    const textColors = [
        "text-blue-800", "text-red-500",  "text-purple-500", 
        "text-yellow-500", "text-green-500", "text-pink-500"
    ];

    const PesoSign = (props) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size || 20}
            height={props.size || 20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <path d="M4 4h12a5 5 0 0 1 0 10H4z" />
            <path d="M14 14H4v8" />
            <path d="M17 15h-6" />
            <path d="M17 9H4" />
        </svg>
    );
    

    const icons = [
        (props) => <Repeat size={20} {...props} />,
        (props) => <AlertTriangle size={20} {...props} />,
        (props) => <PesoSign size={20} {...props} />,
        (props) => <XCircle size={20} {...props} />,
        (props) => <RotateCcw size={20} />,
        (props) => <ShoppingBag size={20} />
    ];

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Returns</h1>
                    <button
                        onClick={() => setReturnsNewModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Return
                    </button>
                </div>

                {/* Summary Section (Return Options) */}
                <div className="grid grid-cols-5 gap-6 mb-8">
                    <button
                        onClick={() => handleSelectedReturnOption("all")}
                        className={`flex flex-col items-center p-6 rounded-xl shadow-md transition transform hover:scale-105 ${
                            selectedReturnOption === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
                        }`}
                        >
                        <Package size={24} className={`${selectedReturnOption === "all" ? "text-white" : "text-blue-600"}`} />
                        <span className="text-sm font-semibold">All Returns</span>
                        <span className="text-lg font-bold">{totalReturns}</span>
                    </button>

                    {returnOptions.map((option, index) => {
                        const buttonColor = colors[index % colors.length];
                        const textColor = textColors[index % colors.length];
                        const Icon = icons[index % icons.length];

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelectedReturnOption(option.id)}
                                className={`flex flex-col items-center p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    selectedReturnOption === option.id 
                                        ? `${buttonColor} text-white shadow-xl` 
                                        : `bg-white border border-gray-300 hover:bg-gray-100`
                                }`}
                            >
                                <Icon className={selectedReturnOption === option.id ? "text-white" : textColor} />
                                <span className="text-sm font-semibold">{option.name}</span>
                                <span className="text-xl font-bold">
                                    {option.returns_count}
                                </span>
                            </button>
                        );
                    })}
                </div>


                {/* Search & Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <input
                        type="text"
                        placeholder="Search by Product or Customer"
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <DatePicker
                        selected={startDate}
                        onChange={(update) => {
                            setDateRange(update);
                        }}
                        startDate={startDate}
                        endDate={endDate}
                        selectsRange
                        isClearable
                        placeholderText="Select duration"
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Returns Table */}
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-200">
                            <tr>
                                <th
                                    className="border p-3 text-left cursor-pointer"
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
                                    className="border p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("date_time_returned")}
                                >
                                    <div className="flex items-center">
                                        <span>DateTime</span>
                                        <span className="ml-1">
                                            {sortColumn === "date_time_returned" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>

                                <th
                                    className="border p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("sales_code")}
                                >
                                    <div className="flex items-center">
                                        <span>Return</span>
                                        <span className="ml-1">
                                            {sortColumn === "sales_code" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>

                                <th className="border p-3 text-left">Change Product to</th>

                                <th
                                    className="border p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("refund_amount")}
                                >
                                    <div className="flex items-center">
                                        <span>Refund Amount</span>
                                        <span className="ml-1">
                                            {sortColumn === "refund_amount" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>

                                <th
                                    className="border p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("return_option_id")}
                                >
                                    <div className="flex items-center">
                                        <span>Status</span>
                                        <span className="ml-1">
                                            {sortColumn === "return_option_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>

                                <th
                                    className="border p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("remarks")}
                                >
                                    <div className="flex items-center">
                                        <span>Remarks</span>
                                        <span className="ml-1">
                                            {sortColumn === "remarks" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                        </span>
                                    </div>
                                </th>
                                <th className="border p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnsList.length > 0 ? (
                                returnsList.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-100">
                                        <td className="border p-3">{item.code}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {moment(item.date_time_returned).format("MMM D, YY h:mma")}
                                        </td>
                                        <td className="border p-3 align-top">
                                            <span className="font-medium">{item.sales_code}</span>
                                            {Array.isArray(item.return_sales_products_list) && item.return_sales_products_list.length > 0 ? (
                                                <div className="mt-1 space-y-1">
                                                    {item.return_sales_products_list.map((returnProducts) => (
                                                        <div key={returnProducts.id} className="p-1 bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
                                                            <p className="text-gray-900 truncate w-40">
                                                                {returnProducts.sale_product_info?.product_info?.name ?? "No Name"}
                                                            </p>
                                                            <p className="text-gray-600 text-sm">
                                                                Amount: <span className="font-semibold">{returnProducts.amount ?? "No Amount"}</span>
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No products</span>
                                            )}
                                        </td>
                                        <td className="border p-3">
                                            <span className="font-medium">{item.sales_of_return_code}</span>
                                            {Array.isArray(item.change_sale_info?.products_list) && item.change_sale_info?.products_list.length > 0 ? (
                                                <div className="mt-1 space-y-1">
                                                    {item.change_sale_info?.products_list.map((changeProducts) => (
                                                        <div key={changeProducts.id} className="p-1 bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
                                                            <p className="text-gray-900 truncate w-40">
                                                                {changeProducts.sale_product_info?.product_info?.name ?? "No Name"}
                                                            </p>
                                                            <p className="text-gray-600 text-sm">
                                                                Amount: <span className="font-semibold">{changeProducts.amount ?? "No Amount"}</span>
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No products</span>
                                            )}
                                        </td>
                                        <td className="border p-3">
                                            {item.refund_amount && parseFloat(item.refund_amount) > 0 
                                                ? item.refund_amount 
                                                : <span className="text-gray-500">None</span>
                                            }
                                        </td>
                                        <td className="border p-3">{item.return_option_info?.name}</td>
                                        <td className="border p-3">{item.remarks}</td>
                                        <td className="border p-3">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleReturnDelete(item.id)}
                                                    className="flex items-center gap-2 px-3 py-1 text-white bg-red-600 border border-red-600 
                                                            rounded-lg shadow transition duration-200 
                                                            hover:bg-white hover:text-red-600 hover:border-red-600"
                                                >
                                                    <Trash size={16} />
                                                    {/* <span>Delete</span> */}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="border p-3 text-center text-gray-500">
                                        No returns found
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

            <ReturnsNewModal 
                isOpen={returnsNewModalOpen} 
                onClose={() => setReturnsNewModalOpen(false)} 
                refreshReturns={() => fetchReturnsList(selectedReturnOption)}
            />

        </Layout>
    );
};

export default Returns;
